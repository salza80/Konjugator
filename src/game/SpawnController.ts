import Phaser from 'phaser';
import { WORD_VARIANTS } from '../core/rules';
import { pacingFor, SPECIAL_TARGETS } from '../core/pacing';
import type { WavePacing } from '../core/pacing';
import type { Playfield, Word, WordKind } from '../core/types';
import { freeColumn, TARGET_LAYOUT } from '../core/targetLayout';
import WordBag from '../core/WordBag';
import DifficultyController from '../core/DifficultyController';
import { GAME } from '../config';
import WordTarget from '../entities/WordTarget';

export default class SpawnController {
  readonly group: Phaser.GameObjects.Group;
  readonly targets = new Set<WordTarget>();
  private running = false;
  private level = 1;
  private elapsed = 0;
  private nextRegularAt = 0;
  private pacing: ReturnType<DifficultyController['pacing']> = { ...pacingFor(1, 0), movementFactor: 1 };
  private refill?: Phaser.Time.TimerEvent;
  private pendingSpecial?: Exclude<WordKind, 'falling'>;
  private readonly wordBag = new WordBag(() => Phaser.Math.RND.frac());

  constructor(private readonly scene: Phaser.Scene, private readonly words: readonly Word[], private readonly bounds: Playfield,
    private readonly blockColumns: () => number[], private readonly onSelect: (target: WordTarget) => void,
    private readonly onRemove: (target: WordTarget) => void, private readonly onMiss: (target: WordTarget) => void,
    private readonly practiceWords?: () => readonly Word[],
    private readonly difficulty = new DifficultyController()) {
    this.group = scene.add.group({ runChildUpdate: true });
  }

  start(level: number): void {
    this.stop();
    this.running = true;
    this.level = level;
    this.elapsed = 0;
    this.pacing = this.difficulty.pacing(level, 0, !!this.practiceWords);
    this.spawn('falling');
    this.nextRegularAt = this.pacing.interval;
  }

  /** The session's clock drives all waves; skipped spawns never build up a backlog. */
  advance(elapsed: number): void {
    if (!this.running || this.practiceWords) return;
    const previousElapsed = this.elapsed;
    this.elapsed = elapsed;
    const pacing = this.difficulty.pacing(this.level, elapsed);
    if (pacing.index !== this.pacing.index) {
      this.pacing = pacing;
      for (const target of this.activeTargets) target.setSpeed(this.speedFor(target.kind, target.word),
        GAME.horizontalWordSpeed * this.pacing.movementFactor * this.difficulty.answerAllowance(target.word));
      this.nextRegularAt = elapsed + pacing.interval;
    }
    for (const special of SPECIAL_TARGETS) {
      if (previousElapsed < special.at && elapsed >= special.at) this.spawn(special.kind);
    }
    if (elapsed >= this.nextRegularAt) {
      this.spawn('falling');
      this.nextRegularAt = elapsed + this.pacing.interval;
    }
  }

  private speedFor(kind: WordKind, word: Word): number {
    return this.pacing.fallingSpeed * (kind === 'bonusfalling' ? 1.5 : 1) * this.difficulty.answerAllowance(word);
  }

  spawn(kind: WordKind): WordTarget | undefined {
    if (!this.running) return;
    if (this.practiceWords && kind !== 'falling') return;
    if (this.refill) {
      // Preserve the breather, then use its refill slot for the scheduled special.
      if (kind !== 'falling') this.pendingSpecial = kind;
      return;
    }
    const words = this.practiceWords?.() ?? this.words;
    if (!words.length) return;
    const active = this.activeTargets;
    if (active.length >= this.pacing.maxTargets) return;
    if (kind !== 'falling' && active.some((target) => target.kind === kind)) return;
    const word = this.wordBag.next(words, active.map((target) => target.word));
    if (!word) return;
    const playBounds = kind === 'bonus' ? { ...this.bounds, bottom: this.bounds.top + TARGET_LAYOUT.bonusHeight }
      : { ...this.bounds, top: this.bounds.top + TARGET_LAYOUT.bonusHeight + TARGET_LAYOUT.gap };
    const target = new WordTarget({
      scene: this.scene,
      word,
      kind,
      bounds: this.bounds,
      playBounds,
      onSelect: this.onSelect,
      onMiss: this.onMiss,
      onRemove: (removed) => {
        this.targets.delete(removed);
        this.onRemove(removed);
      },
    });
    const columns = this.blockColumns();
    const variant = WORD_VARIANTS[kind];
    const preferred = columns.length < 50 && columns.length && Phaser.Math.RND.frac() < variant.targetChance
      ? Phaser.Utils.Array.GetRandom(columns) : Phaser.Math.Between(this.bounds.left, this.bounds.right);
    const fromRight = Phaser.Math.RND.frac() < 0.5;
    const x = kind === 'bonus' ? fromRight ? this.bounds.right - target.displayWidth : this.bounds.left
      : freeColumn(target.displayWidth, playBounds, active.filter((other) => other.kind !== 'bonus')
        .map((other) => ({ x: other.x, y: other.y, width: other.displayWidth, height: other.displayHeight })), preferred);
    if (x === undefined) {
      this.wordBag.defer(word);
      target.destroy();
      return;
    }
    target.start(x, playBounds.top + (kind === 'bonus' ? 8 : 0), this.speedFor(kind, word), fromRight,
      GAME.horizontalWordSpeed * this.pacing.movementFactor * this.difficulty.answerAllowance(word));
    this.wordBag.recordSpawn(word);
    this.targets.add(target);
    this.group.add(target);
    return target;
  }

  /** Reward clearing the field with a short breather, rather than an instant replacement. */
  onFieldCleared(): void {
    if (!this.running || this.activeTargets.length || this.refill) return;
    this.refill = this.scene.time.delayedCall(1500, () => {
      this.refill = undefined;
      const kind = this.pendingSpecial ?? 'falling';
      this.pendingSpecial = undefined;
      if (!this.running || this.activeTargets.length) return;
      this.spawn(kind);
      this.nextRegularAt = this.elapsed + this.pacing.interval;
    });
  }

  get wave(): WavePacing { return this.pacing; }

  clear(): void {
    this.stop();
    for (const target of [...this.targets]) target.destroy();
  }

  stop(): void {
    this.running = false;
    this.refill?.remove();
    this.refill = undefined;
    this.pendingSpecial = undefined;
  }

  get playableTargets(): WordTarget[] {
    return this.activeTargets.filter((target) => target.isPlayable);
  }

  get activeTargets(): WordTarget[] {
    return [...this.targets].filter((target) => target.scene && target.state !== 'resolved');
  }

  highlight(selected?: WordTarget): void {
    for (const target of this.targets) {
      if (target.scene) target.select(target === selected);
    }
  }

  dispose(): void {
    this.stop();
    this.targets.clear();
  }
}
