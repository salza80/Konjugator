import Phaser from 'phaser';
import type { Difficulty } from '../core/rules';
import type { Playfield, Word, WordKind } from '../core/types';
import { chooseWord } from '../core/words';
import WordTarget from '../entities/WordTarget';

export default class SpawnController {
  readonly group: Phaser.GameObjects.Group;
  readonly targets = new Set<WordTarget>();
  private readonly timers = new Set<Phaser.Time.TimerEvent>();
  private running = false;
  private difficulty?: Difficulty;

  constructor(private readonly scene: Phaser.Scene, private readonly words: readonly Word[], private readonly bounds: Playfield,
    private readonly blockColumns: () => number[], private readonly onSelect: (target: WordTarget) => void,
    private readonly onRemove: (target: WordTarget) => void) {
    this.group = scene.add.group({ runChildUpdate: true });
  }

  start(difficulty: Difficulty): void {
    this.running = true;
    this.difficulty = difficulty;
    this.spawn('falling');
    this.schedule('falling', difficulty.fallingDelay);
    this.schedule('bonus', [15000, 50000]);
    this.schedule('bonusfalling', [1500, 50000]);
  }

  spawn(kind: WordKind): WordTarget | undefined {
    if (!this.running || !this.difficulty) return;
    const columns = this.blockColumns();
    const target = new WordTarget({
      scene: this.scene,
      word: chooseWord(this.words, () => Phaser.Math.RND.frac()),
      kind,
      bounds: this.bounds,
      speed: kind === 'bonusfalling' ? this.difficulty.bonusSpeed : this.difficulty.fallingSpeed,
      remainingBlocks: columns.length < 50 ? columns : [],
      onSelect: this.onSelect,
      onRemove: (removed) => {
        this.targets.delete(removed);
        this.onRemove(removed);
      },
    });
    this.targets.add(target);
    this.group.add(target);
    return target;
  }

  private schedule(kind: WordKind, range: readonly [number, number]): void {
    const timer = this.scene.time.delayedCall(Phaser.Math.Between(range[0], range[1]), () => {
      this.timers.delete(timer);
      if (!this.running || !this.difficulty) return;
      this.spawn(kind);
      this.schedule(kind, kind === 'falling' ? this.difficulty.fallingDelay : this.difficulty.bonusDelay);
    });
    this.timers.add(timer);
  }

  clear(): void {
    this.stop();
    for (const target of [...this.targets]) target.destroy();
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers) timer.remove();
    this.timers.clear();
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
