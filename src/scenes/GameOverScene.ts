import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import type { PlayData, ResultData, Word } from '../core/types';
import { canvasShortcuts } from '../platform/keyboard';
import ActionButton from '../ui/ActionButton';
import SoundButton from '../ui/SoundButton';
import { fitText } from '../ui/fitText';

export default class GameOverScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() { super('GameOver'); }
  init(result: ResultData): void { this.result = result; }

  create(): void {
    const { summary, options, words, inputMode, lastCorrection, records } = this.result;
    const reviewCount = summary.mistakes.length;
    const center = GAME.width / 2;
    const attempts = summary.correctAnswers + summary.incorrectAnswers;
    const accuracy = attempts ? `${Math.round(summary.correctAnswers / attempts * 100)}%` : '—';
    const style = { color: '#e9f1f7', fontSize: 26, align: 'center' };
    this.add.rectangle(center, GAME.height / 2, 940, 660, 0x101923);
    new SoundButton(this, GAME.width - 20, 20).setOrigin(1, 0);
    const title = summary.practiceTotal
      ? summary.practiceCompleted === summary.practiceTotal ? 'PRACTICE COMPLETE' : 'PRACTICE OVER'
      : summary.roundCompleted ? 'ROUND COMPLETE' : 'GAME OVER';
    this.add.text(center, 45, title, { ...style, fontSize: 40,
      color: summary.roundCompleted || (summary.practiceTotal > 0 && summary.practiceCompleted === summary.practiceTotal)
        ? COLORS.success : style.color }).setOrigin(0.5, 0);
    this.add.text(center, 110, records.newBest ? 'NEW PERSONAL BEST'
      : records.best ? `FINAL SCORE · BEST ${records.best.score}` : 'FINAL SCORE',
    { ...style, fontSize: 24, color: records.newBest ? '#ffcf70' : style.color }).setOrigin(0.5, 0);
    this.add.text(center, 147, summary.score.toString(), { ...style, color: COLORS.success, fontSize: 54 }).setOrigin(0.5, 0);
    this.add.text(center - 260, 230, 'ACCURACY', { ...style, fontSize: 24 }).setOrigin(0.5, 0);
    this.add.text(center - 260, 265, accuracy, { ...style, fontSize: 44 }).setOrigin(0.5, 0);
    this.add.text(center, 230, 'BEST STREAK', { ...style, fontSize: 24 }).setOrigin(0.5, 0);
    this.add.text(center, 265, summary.bestStreak.toString(), { ...style, color: '#ffcf70', fontSize: 44 }).setOrigin(0.5, 0);
    this.add.text(center + 260, 230, 'MISSED WORDS', { ...style, fontSize: 24 }).setOrigin(0.5, 0);
    this.add.text(center + 260, 265, summary.missedWords.toString(), { ...style, fontSize: 44 }).setOrigin(0.5, 0);
    if (summary.missedBonuses) {
      const bonuses = this.add.text(center + 260, 199, `Bonus skips: ${summary.missedBonuses}`,
        { ...style, fontSize: 24, color: '#a9bac7' }).setOrigin(0.5, 0);
      fitText(bonuses, 240, 28, 24);
    }
    const attemptSummary = attempts
      ? `${summary.unassistedAnswers} unassisted · ${summary.assistedAnswers} with correction · ${summary.incorrectAnswers} incorrect`
      : 'No answers submitted.';
    const attemptsLabel = this.add.text(center, 327, `${attemptSummary}${lastCorrection ? ` · ${reviewCount} review ${reviewCount === 1 ? 'word' : 'words'}` : ''}`,
      { ...style, fontSize: 24 }).setOrigin(0.5, 0);
    fitText(attemptsLabel, 880, 30, 24);
    const total = summary.practiceTotal || summary.roundGoal;
    if (total) {
      const completed = summary.practiceTotal ? summary.practiceCompleted : summary.correctAnswers;
      const fraction = Phaser.Math.Clamp(completed / total, 0, 1);
      const progress = summary.practiceTotal
        ? `Practice: ${completed}/${total} ${total === 1 ? 'word' : 'words'} completed · ${Math.round(fraction * 100)}%`
        : `Round goal: ${completed}/${total} correct`;
      this.add.text(center, 365, progress, { ...style, fontSize: 24 }).setOrigin(0.5, 0);
      this.add.rectangle(center - 240, 400, 480, 10, 0x344554).setOrigin(0);
      if (fraction) this.add.rectangle(center - 240, 400, 480 * fraction, 10, 0x8ff0a4).setOrigin(0);
    }
    if (lastCorrection) {
      const prompt = this.add.text(center, 421, `Last correction: ${lastCorrection.question}`,
        { ...style, fontSize: 24, color: '#a9bac7' }).setOrigin(0.5, 0);
      const answer = this.add.text(center, 457, `Correct answer: ${lastCorrection.answer}`,
        { ...style, fontSize: 30, color: COLORS.success }).setOrigin(0.5, 0);
      fitText(prompt, 880, 30, 24);
      fitText(answer, 880, 36, 30);
    } else {
      this.add.text(center, 421, 'Accuracy uses submitted answers; misses are counted separately.', {
        ...style, fontSize: 22, color: '#a9bac7',
      }).setOrigin(0.5, 0);
      this.add.text(center, 463, reviewCount
        ? `${reviewCount} unique ${reviewCount === 1 ? 'word' : 'words'} to practise`
        : 'No review words recorded.', { ...style, fontSize: 24, color: COLORS.success }).setOrigin(0.5, 0);
    }

    let leaving = false;
    const start = (practiceWords?: readonly Word[]): void => {
      if (leaving) return;
      leaving = true;
      const data: PlayData = { options, words, inputMode, practiceWords, replay: true };
      this.scene.start('GameScene', data);
    };
    const playAgain = (): void => start();
    const practise = (): void => {
      if (summary.mistakes.length) start(summary.mistakes);
    };
    const menu = (): void => {
      if (leaving) return;
      leaving = true;
      this.scene.start('TitleScene', { options, words });
    };
    new ActionButton(this, center - 330, 515, 'Play Again', playAgain, 260).setOrigin(0.5, 0);
    new ActionButton(this, center, 515, 'Practise Mistakes', practise, 360)
      .setOrigin(0.5, 0).setEnabled(reviewCount > 0);
    new ActionButton(this, center + 330, 515, 'Menu', menu, 220).setOrigin(0.5, 0);
    const target = this.add.text(center, 615, records.target, { ...style, fontSize: 24, color: '#ffcf70' }).setOrigin(0.5, 0);
    fitText(target, 880, 30, 24);
    this.add.text(center, 663, reviewCount ? 'Enter: play again · P: practise · X: menu' : 'Enter: play again · X: menu', {
      ...style, fontSize: 24,
    }).setOrigin(0.5, 0);
    this.game.canvas.focus({ preventScroll: true });
    canvasShortcuts(this, { enter: playAgain, x: menu, ...(reviewCount ? { p: practise } : {}) });
    // The public callback remains compatible and fires once for each completed game.
    options.onGameOver?.({ score: summary.score });
  }
}
