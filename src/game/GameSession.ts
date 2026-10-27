import Phaser from 'phaser';
import { GAME } from '../config';
import { normalizeAnswer } from '../core/answers';
import SessionProgress from '../core/SessionProgress';
import DifficultyController from '../core/DifficultyController';
import { wordKey } from '../core/words';
import { blockPositions, repairPosition } from '../core/rules';
import type { GameOptions, InputMode, Playfield, SessionMode, SessionPhase, SessionResult, Word } from '../core/types';
import Block from '../entities/Block';
import Bullet from '../entities/Bullet';
import WordTarget from '../entities/WordTarget';
import type { PlayerInput } from '../input/types';
import { gameAudio, type GameAudio } from '../platform/audio';
import type GameHud from '../ui/GameHud';
import SpawnController from './SpawnController';

/** Owns a single game's state. UI and input are attached by GameScene. */
export default class GameSession {
  level = 1;
  readonly progress: SessionProgress;
  get score(): number { return this.progress.score; }
  get streak(): number { return this.progress.streak; }
  secondsRemaining: number = GAME.levelSeconds;
  phase: SessionPhase = 'countdown';
  private readonly blocks = new Set<Block>();
  private readonly blockGroup: Phaser.GameObjects.Group;
  private readonly bullets: Phaser.GameObjects.Group;
  readonly spawner: SpawnController;
  private timer?: Phaser.Time.TimerEvent;
  private input?: PlayerInput;
  private readonly audio: GameAudio;
  private readonly difficulty: DifficultyController;
  private disposed = false;
  private countdown: number = GAME.initialCountdownSeconds;
  private elapsedMs = 0;
  private readonly tickClock = (_time: number, delta: number): void => { this.elapsedMs += delta * this.scene.time.timeScale; };

  constructor(private readonly scene: Phaser.Scene, words: readonly Word[], private readonly bounds: Playfield,
    private mode: InputMode, private readonly hud: GameHud, private readonly onGameOver: (result: SessionResult) => void,
    sessionMode: SessionMode, private readonly options: GameOptions) {
    this.audio = gameAudio(scene.game);
    this.progress = new SessionProgress(sessionMode);
    this.difficulty = new DifficultyController(options.difficulty, mode);
    this.blockGroup = scene.add.group();
    this.bullets = scene.add.group();
    scene.events.on('update', this.tickClock);
    hud.onCorrectionShown((word) => this.progress.review.expose(word, this.elapsedMs));
    this.spawner = new SpawnController({
      scene, words, bounds, difficulty: this.difficulty, review: this.progress.review, now: () => this.elapsedMs,
      blockColumns: () => [...this.blocks].map((block) => block.x),
      onSelect: (target) => this.input?.select?.(target),
      onRemove: (target) => {
        if (!this.disposed) {
          this.input?.remove?.(target);
          this.advanceLevelIfReady();
        }
      },
      onMiss: (target) => this.missedWord(target),
      onReviewWait: () => {
        if (sessionMode.kind === 'practice') hud.showPractice(this.progress.practiceCompleted, this.progress.practiceTotal, true);
      },
      onSpawn: () => {
        if (sessionMode.kind === 'practice') hud.showPractice(this.progress.practiceCompleted, this.progress.practiceTotal);
      },
      practiceWords: sessionMode.kind === 'practice' ? () => this.progress.remainingWords : undefined,
    });
    for (const position of blockPositions(options.startingHealth, bounds, GAME.blockSize, () => Phaser.Math.RND.frac())) {
      const block = new Block(scene, position.x, position.y);
      this.blocks.add(block);
      this.blockGroup.add(block);
    }
    this.hud.showHealth(this.blocks.size, options.startingHealth);
    this.hud.showStreak(this.streak, 0);
    this.hud.showRoundGoal(0, this.progress.roundGoal);
    scene.physics.add.overlap(this.spawner.group, this.blockGroup, (target, block) => {
      if (target instanceof WordTarget && block instanceof Block) this.miss(target, block);
    });
  }

  attachInput(input: PlayerInput, mode = this.mode): void {
    this.input?.dispose();
    this.input = input;
    this.mode = mode;
    this.difficulty.setInputMode(mode);
  }

  resume(): void { this.input?.resume?.(); }

  startLevel(): void {
    if (this.disposed || this.phase === 'over') return;
    this.phase = 'countdown';
    this.clearLevel();
    this.countdown = this.level === 1 ? GAME.initialCountdownSeconds : GAME.levelCountdownSeconds;
    this.hud.showCountdown(this.level, this.countdown, this.progress.practiceTotal);
    this.timer = this.scene.time.addEvent({
      delay: 1000,
      repeat: this.countdown - 1,
      callback: () => {
        this.countdown--;
        if (this.countdown === 0) this.beginPlay();
        else this.hud.showCountdown(this.level, this.countdown, this.progress.practiceTotal);
      },
    });
  }

  private beginPlay(): void {
    this.input?.clear();
    this.phase = 'playing';
    this.secondsRemaining = GAME.levelSeconds;
    this.hud.showLevel(this.level, this.secondsRemaining);
    this.spawner.start(this.level);
    if (this.progress.mode.kind === 'practice') {
      this.hud.showPractice(0, this.progress.practiceTotal);
      return;
    }
    this.hud.showWave(this.spawner.wave.index, this.spawner.wave.label);
    this.timer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.secondsRemaining = Math.max(0, this.secondsRemaining - 1);
        if (this.secondsRemaining <= GAME.levelSpawnGraceSeconds) {
          // Cancel scheduled refills too, while leaving existing words fully playable.
          this.spawner.stop();
          this.hud.showLevelClosing(this.level, this.secondsRemaining, this.spawner.activeTargets.length);
        } else {
          this.hud.showLevel(this.level, this.secondsRemaining);
          this.spawner.advance(GAME.levelSeconds - this.secondsRemaining);
          this.hud.showWave(this.spawner.wave.index, this.spawner.wave.label);
        }
        this.advanceLevelIfReady();
      },
    });
  }

  private advanceLevelIfReady(): void {
    if (this.disposed || this.phase !== 'playing' || !this.scene.sys.isActive()
      || this.progress.mode.kind === 'practice' || this.secondsRemaining > GAME.levelSpawnGraceSeconds
      || this.spawner.targets.size > 0) return;
    // Keep existing words playable and let their answer labels finish, then skip idle closing time.
    this.level++;
    this.startLevel();
  }

  readonly submit = (answer: string, reportMiss = true): boolean => {
    if (this.disposed || this.phase !== 'playing') return false;
    const normalized = normalizeAnswer(answer);
    if (!normalized) return false;
    const targets = this.spawner.playableTargets.filter((target) => normalizeAnswer(target.word.answer) === normalized);
    const first = targets[0];
    if (first) {
      this.difficulty.record(true);
      const award = this.progress.accept(targets, this.elapsedMs);
      for (const target of targets) {
        target.resolve(true, target === first ? award.total : undefined, award.assisted);
        this.input?.remove?.(target);
        this.bullets.add(new Bullet(this.scene, this.bounds.bottom, target, (this.bounds.left + this.bounds.right) / 2));
      }
      // Speak once even when the same answer clears several targets.
      if (this.mode !== 'Voice') this.audio.say(first.word.voice || first.word.answer);
      this.hud.showScore(this.score);
      this.hud.showRoundGoal(this.progress.correctAnswers, this.progress.roundGoal);
      this.hud.showStreak(this.streak, award.streakBonus);
      if (award.milestone !== undefined) {
        const repaired = this.repairBase();
        this.hud.showMilestone(award.milestone, repaired);
        this.scene.sound.playAudioSprite('sfx', 'smb_powerup');
      }
      const bonuses = [
        award.targetBonus ? `+${award.targetBonus} target` : '',
        award.streakBonus ? `+${award.streakBonus} streak` : '',
      ].filter(Boolean);
      this.hud.showFeedback(`${award.assisted ? 'Correct with help' : award.recovered ? 'Recovered!' : 'Correct!'} ${first.word.answer}  +${award.total}${bonuses.length ? ` (${bonuses.join(', ')})` : ''}`, 'success');
      if (this.progress.mode.kind === 'practice') {
        this.hud.showPractice(this.progress.practiceCompleted, this.progress.practiceTotal);
      }
      if (this.progress.completed) this.finishGame();
      else this.spawner.onFieldCleared();
    } else if (reportMiss) {
      this.rejectAnswer();
    }
    return targets.length > 0;
  };

  readonly rejectAnswer = (message = 'No matching answer — try again. Health unchanged.', word?: Word): void => {
    if (this.disposed || this.phase !== 'playing') return;
    const candidates = new Map((word ? [word] : this.spawner.playableTargets.map((target) => target.word))
      .map((candidate) => [wordKey(candidate), candidate]));
    const reset = this.progress.reject([...candidates.values()], this.elapsedMs);
    this.difficulty.record(false);
    this.hud.showStreak(this.streak, 0);
    const candidate = candidates.size === 1 ? candidates.values().next().value : undefined;
    if (candidate) this.hud.showCorrection(candidate, 'retry');
    else this.hud.showFeedback(`${message}${reset ? ' Streak reset.' : ''}`, 'error');
    this.scene.sound.playAudioSprite('sfx', 'smb_bump');
  };

  private missedWord(target: WordTarget): void {
    if (this.disposed || this.phase !== 'playing') return;
    this.progress.miss(target.word, target.kind, this.elapsedMs);
    this.input?.remove?.(target);
    this.hud.showCorrection(target.word, target.kind === 'bonus' ? 'bonus' : 'missed');
    if (target.kind === 'bonus') return;
    this.difficulty.record(false);
    this.hud.showStreak(this.streak, 0);
    if (this.progress.mode.kind === 'practice') this.spawner.onFieldCleared();
  }

  private miss(target: WordTarget, block: Block): void {
    if (this.phase !== 'playing' || target.state !== 'active' || !this.blocks.has(block)) return;
    this.progress.miss(target.word, target.kind, this.elapsedMs);
    this.difficulty.record(false);
    this.hud.showStreak(this.streak, 0);
    this.blocks.delete(block);
    block.breakApart();
    target.resolve(false);
    this.input?.remove?.(target);
    this.hud.showHealth(this.blocks.size, this.options.startingHealth);
    this.hud.showCorrection(target.word, 'damage');
    if (!this.blocks.size) this.finishGame();
    else if (this.progress.mode.kind === 'practice') this.spawner.onFieldCleared();
  }

  private repairBase(): boolean {
    if (this.blocks.size >= this.options.startingHealth) return false;
    const position = repairPosition([...this.blocks].map((block) => ({ x: block.x, y: block.y })), this.bounds, GAME.blockSize);
    if (!position) return false;
    const block = new Block(this.scene, position.x, position.y);
    this.blocks.add(block);
    this.blockGroup.add(block);
    this.hud.showHealth(this.blocks.size, this.options.startingHealth);
    return true;
  }

  private finishGame(): void {
    if (this.disposed || this.phase === 'over') return;
    this.phase = 'over';
    this.clearLevel(!this.progress.roundCompleted);
    this.onGameOver(this.progress.result());
  }

  private clearLevel(recordUnanswered = true): void {
    if (recordUnanswered) {
      this.progress.remember(this.spawner.activeTargets.map((target) => target.word));
    }
    this.timer?.remove();
    this.timer = undefined;
    this.input?.clear();
    this.spawner.clear();
    this.bullets.clear(true, true);
  }

  pause(): void {
    this.input?.pause();
    this.audio.cancelSpeech();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.events.off('update', this.tickClock);
    this.hud.onCorrectionShown();
    this.timer?.remove();
    this.spawner.dispose();
    this.input?.dispose();
    this.audio.cancelSpeech();
    // Phaser owns group, collider and display-object destruction on shutdown.
    this.blocks.clear();
  }
}
