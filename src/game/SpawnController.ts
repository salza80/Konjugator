import Phaser from 'phaser';
import { WORD_VARIANTS } from '../core/rules';
import { pacingFor, SPECIAL_TARGETS } from '../core/pacing';
import type { WavePacing } from '../core/pacing';
import type { Playfield, Word, WordKind } from '../core/types';
import { freeColumn, TARGET_LAYOUT } from '../core/targetLayout';
import WordBag from '../core/WordBag';
import type DifficultyController from '../core/DifficultyController';
import { GAME } from '../config';
import WordTarget from '../entities/WordTarget';
import type ReviewQueue from '../core/ReviewQueue';

interface SpawnConfig {
  scene: Phaser.Scene;
  words: readonly Word[];
  bounds: Playfield;
  blockColumns: () => number[];
  onSelect: (target: WordTarget) => void;
  onRemove: (target: WordTarget) => void;
  onMiss: (target: WordTarget) => void;
  onReviewWait?: () => void;
  onSpawn?: () => void;
  practiceWords?: () => readonly Word[];
  difficulty: DifficultyController;
  review: ReviewQueue;
  now: () => number;
}

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

  constructor(private readonly config: SpawnConfig) {
    this.group = config.scene.add.group({ runChildUpdate: true });
  }

  start(level: number): void {
    this.stop();
    this.running = true;
    this.level = level;
    this.elapsed = 0;
    this.pacing = this.config.difficulty.pacing(level, 0, !!this.config.practiceWords);
    this.spawn('falling');
    this.nextRegularAt = this.pacing.interval;
  }

  /** The session's clock drives all waves; skipped spawns never build up a backlog. */
  advance(elapsed: number): void {
    if (!this.running || this.config.practiceWords) return;
    const previousElapsed = this.elapsed;
    this.elapsed = elapsed;
    const pacing = this.config.difficulty.pacing(this.level, elapsed);
    if (pacing.index !== this.pacing.index) {
      this.pacing = pacing;
      for (const target of this.activeTargets) target.setSpeed(this.speedFor(target.kind, target.word),
        GAME.horizontalWordSpeed * this.pacing.movementFactor * this.config.difficulty.answerAllowance(target.word));
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
    return this.pacing.fallingSpeed * (kind === 'bonusfalling' ? 1.5 : 1) * this.config.difficulty.answerAllowance(word);
  }

  spawn(kind: WordKind): WordTarget | undefined {
    if (!this.running) return;
    if (this.config.practiceWords && kind !== 'falling') return;
    if (this.refill) {
      // Preserve the breather, then use its refill slot for the scheduled special.
      if (kind !== 'falling') this.pendingSpecial = kind;
      return;
    }
    const pool = this.config.practiceWords?.() ?? this.config.words;
    if (!pool.length) return;
    const now = this.config.now();
    const words = this.config.review.available(pool, now);
    const active = this.activeTargets;
    if (!words.length) {
      if (!active.length) {
        if (kind !== 'falling') this.pendingSpecial = kind;
        this.config.onReviewWait?.();
        this.onFieldCleared(this.config.review.waitMs(pool, now));
      }
      return;
    }
    if (active.length >= this.pacing.maxTargets) return;
    if (kind !== 'falling' && active.some((target) => target.kind === kind)) return;
    const activeWords = active.map((target) => target.word);
    const word = this.config.review.next(pool, activeWords, now) ?? this.wordBag.next(words, activeWords);
    if (!word) return;
    const playBounds = kind === 'bonus' ? { ...this.config.bounds, bottom: this.config.bounds.top + TARGET_LAYOUT.bonusHeight }
      : { ...this.config.bounds, top: this.config.bounds.top + TARGET_LAYOUT.bonusHeight + TARGET_LAYOUT.gap };
    const target = new WordTarget({
      scene: this.config.scene,
      word,
      kind,
      bounds: this.config.bounds,
      playBounds,
      onSelect: this.config.onSelect,
      onMiss: this.config.onMiss,
      onRemove: (removed) => {
        this.targets.delete(removed);
        this.config.onRemove(removed);
      },
    });
    const columns = this.config.blockColumns();
    const variant = WORD_VARIANTS[kind];
    const preferred = columns.length < 50 && columns.length && Phaser.Math.RND.frac() < variant.targetChance
      ? Phaser.Utils.Array.GetRandom(columns) : Phaser.Math.Between(this.config.bounds.left, this.config.bounds.right);
    const fromRight = Phaser.Math.RND.frac() < 0.5;
    const x = kind === 'bonus' ? fromRight ? this.config.bounds.right - target.displayWidth : this.config.bounds.left
      : freeColumn(target.displayWidth, playBounds, active.filter((other) => other.kind !== 'bonus')
        .map((other) => ({ x: other.x, y: other.y, width: other.displayWidth, height: other.displayHeight })), preferred);
    if (x === undefined) {
      this.wordBag.defer(word);
      target.destroy();
      return;
    }
    target.start(x, playBounds.top + (kind === 'bonus' ? 8 : 0), this.speedFor(kind, word), fromRight,
      GAME.horizontalWordSpeed * this.pacing.movementFactor * this.config.difficulty.answerAllowance(word));
    this.config.review.present(word, activeWords, now);
    this.wordBag.recordSpawn(word);
    this.targets.add(target);
    this.group.add(target);
    this.config.onSpawn?.();
    return target;
  }

  /** Reward clearing the field with a short breather, rather than an instant replacement. */
  onFieldCleared(delay = 1500): void {
    if (!this.running || this.activeTargets.length || this.refill) return;
    this.refill = this.config.scene.time.delayedCall(delay, () => {
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
