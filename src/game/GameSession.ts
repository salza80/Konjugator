import Phaser from 'phaser';
import { GAME } from '../config';
import { normalizeAnswer } from '../core/answers';
import { blockPositions, initialDifficulty, nextDifficulty, scoreFor } from '../core/rules';
import type { InputMode, Playfield, SessionPhase, Word } from '../core/types';
import Block from '../entities/Block';
import Bullet from '../entities/Bullet';
import WordTarget from '../entities/WordTarget';
import type { PlayerInput } from '../input/types';
import { SpeechPlayback } from '../platform/speech';
import type GameHud from '../ui/GameHud';
import SpawnController from './SpawnController';

/** Owns a single game's state. UI and input are attached by GameScene. */
export default class GameSession {
  level = 1;
  score = 0;
  secondsRemaining: number = GAME.levelSeconds;
  phase: SessionPhase = 'countdown';
  private difficulty = initialDifficulty();
  private readonly blocks = new Set<Block>();
  private readonly blockGroup: Phaser.GameObjects.Group;
  private readonly bullets: Phaser.GameObjects.Group;
  readonly spawner: SpawnController;
  private timer?: Phaser.Time.TimerEvent;
  private input?: PlayerInput;
  private readonly speech = new SpeechPlayback();
  private disposed = false;
  private countdown: number = GAME.countdownSeconds;

  constructor(private readonly scene: Phaser.Scene, words: readonly Word[], private readonly bounds: Playfield,
    private readonly mode: InputMode, private readonly hud: GameHud, private readonly onGameOver: (score: number) => void) {
    this.blockGroup = scene.add.group();
    this.bullets = scene.add.group({ runChildUpdate: true });
    this.spawner = new SpawnController(scene, words, bounds, () => [...this.blocks].map((block) => block.x),
      (target) => this.input?.select?.(target), (target) => {
        if (!this.disposed) this.input?.remove?.(target);
      });
    for (const position of blockPositions(GAME.startingBlocks, bounds, GAME.blockSize, () => Phaser.Math.RND.frac())) {
      const block = new Block(scene, position.x, position.y);
      this.blocks.add(block);
      this.blockGroup.add(block);
    }
    scene.physics.add.overlap(this.spawner.group, this.blockGroup, (target, block) => {
      if (target instanceof WordTarget && block instanceof Block) this.miss(target, block);
    });
  }

  attachInput(input: PlayerInput): void {
    this.input = input;
  }

  startLevel(): void {
    if (this.disposed || this.phase === 'over') return;
    this.clearLevel();
    this.phase = 'countdown';
    this.countdown = GAME.countdownSeconds;
    this.hud.showCountdown(this.level, this.countdown);
    this.timer = this.scene.time.addEvent({
      delay: 1000,
      repeat: GAME.countdownSeconds - 1,
      callback: () => {
        this.countdown--;
        if (this.countdown === 0) this.beginPlay();
        else this.hud.showCountdown(this.level, this.countdown);
      },
    });
  }

  private beginPlay(): void {
    this.input?.clear();
    this.phase = 'playing';
    this.secondsRemaining = GAME.levelSeconds;
    this.hud.showLevel(this.level, this.secondsRemaining);
    this.spawner.start(this.difficulty);
    this.timer = this.scene.time.addEvent({
      delay: 1000,
      repeat: GAME.levelSeconds - 1,
      callback: () => {
        this.secondsRemaining--;
        this.hud.showLevel(this.level, this.secondsRemaining);
        if (this.secondsRemaining === 0) {
          this.level++;
          this.difficulty = nextDifficulty(this.difficulty);
          this.startLevel();
        }
      },
    });
  }

  readonly submit = (answer: string, reportMiss = true): boolean => {
    if (this.disposed || this.phase !== 'playing') return false;
    const normalized = normalizeAnswer(answer);
    if (!normalized) return false;
    const targets = this.spawner.activeTargets.filter((target) => target.state === 'active' && normalizeAnswer(target.word.answer) === normalized);
    for (const target of targets) {
      target.state = 'targeted';
      // Avoid feeding the spoken answer back into voice recognition.
      if (this.mode !== 'Voice') this.speech.say(target.word.voice || target.word.answer);
      const bullet = new Bullet(this.scene, this.bounds.bottom, target, (this.bounds.left + this.bounds.right) / 2);
      this.bullets.add(bullet);
      bullet.collider = this.scene.physics.add.overlap(bullet, target, () => this.hit(bullet, target));
    }
    if (!targets.length && reportMiss) {
      this.scene.cameras.main.shake(100, 0.05);
      this.scene.sound.playAudioSprite('sfx', 'smb_bump');
    }
    return targets.length > 0;
  };

  private hit(bullet: Bullet, target: WordTarget): void {
    if (this.phase !== 'playing' || target.state === 'resolved') {
      bullet.destroy();
      return;
    }
    this.score += scoreFor(target.word.answer, target.kind, this.level);
    bullet.destroy();
    target.resolve(true);
    this.input?.remove?.(target);
    this.hud.showScore(this.score, target.kind !== 'falling');
    if (!this.spawner.activeTargets.length) this.spawner.spawn('falling');
  }

  private miss(target: WordTarget, block: Block): void {
    if (this.phase !== 'playing' || target.state === 'resolved' || !this.blocks.has(block)) return;
    this.blocks.delete(block);
    block.breakApart();
    target.resolve(false);
    this.input?.remove?.(target);
    if (!this.blocks.size) {
      this.phase = 'over';
      this.clearLevel();
      this.onGameOver(this.score);
    }
  }

  private clearLevel(): void {
    this.timer?.remove();
    this.timer = undefined;
    this.input?.clear();
    this.spawner.clear();
    this.bullets.clear(true, true);
  }

  pause(): void {
    this.input?.pause();
    this.speech.cancel();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.timer?.remove();
    this.spawner.dispose();
    this.input?.dispose();
    this.speech.cancel();
    // Phaser owns group, collider and display-object destruction on shutdown.
    this.blocks.clear();
  }
}
