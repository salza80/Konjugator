import type Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import type { Word } from '../core/types';
import { wordKey } from '../core/words';
import { fitText, singleLine } from './fitText';

export type FeedbackKind = 'success' | 'error' | 'damage';
export type CorrectionKind = 'missed' | 'damage' | 'bonus' | 'retry';
interface Correction { word: Word; kind: CorrectionKind }

const HEADINGS: Record<CorrectionKind, string> = {
  missed: 'Missed −1 health', damage: 'Base hit −1 health', bonus: 'Optional bonus skipped', retry: 'Try again',
};
const MAX_PENDING = 6;

/** Readable question/answer pairs, with a bounded queue for bursts of misses. */
export default class FeedbackBanner {
  private readonly heading: Phaser.GameObjects.Text;
  private readonly answer: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly pending: Correction[] = [];
  private current?: Correction;
  private timer?: Phaser.Time.TimerEvent;
  lastCorrection?: Word;
  lastShownWord?: Word;
  onDisplay?: (word: Word) => void;

  constructor(private readonly scene: Phaser.Scene, center: number, private readonly width: number) {
    this.heading = scene.add.text(center, 107, '', { align: 'center' }).setOrigin(0.5, 0).setDepth(11);
    this.answer = scene.add.text(center, 137, '', { align: 'center', color: COLORS.success })
      .setOrigin(0.5, 0).setDepth(11);
    this.hint = scene.add.text(center, 174, '', { align: 'center', color: '#c0d3df' })
      .setOrigin(0.5, 0).setDepth(11);
  }

  showCorrection(word: Word, kind: CorrectionKind): void {
    const correction = { word, kind };
    this.lastCorrection = word;
    const key = wordKey(word);
    if (this.current && wordKey(this.current.word) === key) {
      if (this.current.kind !== 'retry' && kind === 'retry') return;
      this.display(correction);
      return;
    }
    const index = this.pending.findIndex((entry) => wordKey(entry.word) === key);
    if (index >= 0) this.pending[index] = correction;
    else this.pending.push(correction);
    if (this.pending.length > MAX_PENDING) this.pending.shift();
    if (!this.current) this.showNext();
  }

  showStatus(message: string, kind: FeedbackKind, interrupt = false, word?: Word): void {
    // Score and target effects still respond immediately while a correction is being read.
    if (this.current && !interrupt) return;
    if (this.current) {
      this.pending.unshift(this.current);
      if (this.pending.length > MAX_PENDING) this.pending.pop();
    }
    this.current = undefined;
    this.timer?.remove();
    const prefix = kind === 'success' ? '✓ ' : kind === 'damage' ? '− ' : '↻ ';
    this.heading.setText(prefix + message).setColor(kind === 'success' ? COLORS.success : kind === 'damage' ? COLORS.error : '#ffcf70');
    fitText(this.heading, this.width, 62, 28);
    this.answer.setText('');
    singleLine(this.hint, word?.tip ? `Hint: ${word.tip}` : '', this.width, 22);
    if (word) this.lastShownWord = word;
    this.timer = this.scene.time.delayedCall(GAME.feedbackDisplayMs, () => this.showNext());
  }

  private display(correction: Correction): void {
    this.timer?.remove();
    this.current = correction;
    this.lastShownWord = correction.word;
    this.onDisplay?.(correction.word);
    this.heading.setText(`${HEADINGS[correction.kind]}: ${correction.word.question}`)
      .setColor(correction.kind === 'retry' || correction.kind === 'bonus' ? '#ffcf70' : COLORS.error);
    fitText(this.heading, this.width, 28, 24);
    this.answer.setText(`Correct answer: ${correction.word.answer}`);
    fitText(this.answer, this.width, 34, 30);
    singleLine(this.hint, correction.word.tip ? `Hint: ${correction.word.tip}` : '', this.width, 22);
    this.timer = this.scene.time.delayedCall(GAME.correctionDisplayMs, () => this.showNext());
  }

  private showNext(): void {
    this.current = undefined;
    const next = this.pending.shift();
    if (next) this.display(next);
    else { this.heading.setText(''); this.answer.setText(''); this.hint.setText(''); }
  }

  clear(): void {
    this.timer?.remove();
    this.timer = undefined;
    this.current = undefined;
    this.pending.length = 0;
    this.heading.setText('');
    this.answer.setText('');
    this.hint.setText('');
    this.lastCorrection = undefined;
    this.lastShownWord = undefined;
  }

  destroy(): void {
    // Phaser may have destroyed display objects before the owner's cleanup runs.
    this.timer?.remove();
    this.pending.length = 0;
    this.current = undefined;
    this.heading.destroy();
    this.answer.destroy();
    this.hint.destroy();
  }
}
