import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import type { PlayData, ResultData, Word } from '../core/types';
import { canvasShortcuts } from '../platform/keyboard';
import InputButton from '../ui/InputButton';
import SoundButton from '../ui/SoundButton';
import { fitText } from '../ui/fitText';

export default class GameOverScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() { super('GameOver'); }
  init(result: ResultData): void { this.result = result; }

  create(): void {
    const { summary, options, words, inputMode, lastCorrection } = this.result;
    const reviewCount = summary.mistakes.length;
    const center = GAME.width / 2;
    const attempts = summary.correctAnswers + summary.incorrectAnswers;
    const accuracy = attempts ? `${Math.round(summary.correctAnswers / attempts * 100)}%` : '—';
    const style = { color: '#e9f1f7', fontSize: 22, align: 'center' };
    this.add.rectangle(center, GAME.height / 2, 900, 590, 0x101923);
    new SoundButton(this, GAME.width - 20, 20).setOrigin(1, 0);
    const title = summary.practiceTotal
      ? summary.practiceCompleted === summary.practiceTotal ? 'PRACTICE COMPLETE' : 'PRACTICE OVER'
      : summary.roundCompleted ? 'ROUND COMPLETE' : 'GAME OVER';
    this.add.text(center, 85, title, { ...style, fontSize: 40,
      color: summary.roundCompleted || (summary.practiceTotal > 0 && summary.practiceCompleted === summary.practiceTotal)
        ? COLORS.success : style.color }).setOrigin(0.5, 0);
    this.add.text(center, 151, 'FINAL SCORE', { ...style, fontSize: 18 }).setOrigin(0.5, 0);
    this.add.text(center, 180, summary.score.toString(), { ...style, color: COLORS.success, fontSize: 54 }).setOrigin(0.5, 0);
    this.add.text(center - 260, 270, 'ACCURACY', { ...style, fontSize: 18 }).setOrigin(0.5, 0);
    this.add.text(center - 260, 303, accuracy, { ...style, fontSize: 44 }).setOrigin(0.5, 0);
    this.add.text(center, 270, 'BEST STREAK', { ...style, fontSize: 18 }).setOrigin(0.5, 0);
    this.add.text(center, 303, summary.bestStreak.toString(), { ...style, color: '#ffcf70', fontSize: 44 }).setOrigin(0.5, 0);
    this.add.text(center + 260, 270, 'MISSED WORDS', { ...style, fontSize: 18 }).setOrigin(0.5, 0);
    this.add.text(center + 260, 303, summary.missedWords.toString(), { ...style, fontSize: 44 }).setOrigin(0.5, 0);
    const attemptSummary = attempts
      ? `${summary.unassistedAnswers} unassisted · ${summary.assistedAnswers} with correction · ${summary.incorrectAnswers} incorrect`
      : 'No answers submitted.';
    const attemptsLabel = this.add.text(center, 367, `${attemptSummary}${lastCorrection ? ` · ${reviewCount} review ${reviewCount === 1 ? 'word' : 'words'}` : ''}`,
      { ...style, fontSize: 20 }).setOrigin(0.5, 0);
    fitText(attemptsLabel, 820, 26, 20);
    const total = summary.practiceTotal || summary.roundGoal;
    if (total) {
      const completed = summary.practiceTotal ? summary.practiceCompleted : summary.correctAnswers;
      const fraction = Phaser.Math.Clamp(completed / total, 0, 1);
      const progress = summary.practiceTotal
        ? `Practice: ${completed}/${total} ${total === 1 ? 'word' : 'words'} completed · ${Math.round(fraction * 100)}%`
        : `Round goal: ${completed}/${total} correct`;
      this.add.text(center, 402, progress, { ...style, fontSize: 20 }).setOrigin(0.5, 0);
      this.add.rectangle(center - 240, 432, 480, 10, 0x344554).setOrigin(0);
      if (fraction) this.add.rectangle(center - 240, 432, 480 * fraction, 10, 0x8ff0a4).setOrigin(0);
    }
    if (lastCorrection) {
      const prompt = this.add.text(center, 450, `Last correction: ${lastCorrection.question}`,
        { ...style, fontSize: 18, color: '#a9bac7' }).setOrigin(0.5, 0);
      const answer = this.add.text(center, 476, `Correct answer: ${lastCorrection.answer}`,
        { ...style, fontSize: 26, color: COLORS.success }).setOrigin(0.5, 0);
      fitText(prompt, 820, 22, 18);
      fitText(answer, 820, 30, 26);
    } else {
      this.add.text(center, 450, 'Accuracy uses submitted answers; misses are counted separately.', {
        ...style, fontSize: 16, color: '#a9bac7',
      }).setOrigin(0.5, 0);
      this.add.text(center, 480, reviewCount
        ? `${reviewCount} unique ${reviewCount === 1 ? 'word' : 'words'} to practise`
        : 'No review words recorded.', { ...style, fontSize: 17, color: COLORS.success }).setOrigin(0.5, 0);
    }

    let leaving = false;
    const start = (practiceWords?: readonly Word[]): void => {
      if (leaving) return;
      leaving = true;
      const data: PlayData = { options, words, inputMode, practiceWords };
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
    new InputButton(this, center - 280, 515, 'Play Again', playAgain, 24)
      .setPadding(18, 12).setBackgroundColor('#203e40').setOrigin(0.5, 0);
    if (reviewCount) {
      new InputButton(this, center, 515, 'Practise My Mistakes', practise, 24)
        .setPadding(18, 12).setBackgroundColor('#203e40').setOrigin(0.5, 0);
    } else {
      this.add.text(center, 515, 'Practise My Mistakes', { ...style, fontSize: 24, color: '#718497' })
        .setPadding(18, 12).setBackgroundColor('#1b2631').setOrigin(0.5, 0);
    }
    new InputButton(this, center + 300, 515, 'Menu', menu, 24)
      .setPadding(18, 12).setBackgroundColor('#24313e').setOrigin(0.5, 0);
    this.add.text(center, 600, reviewCount ? 'Enter: play again · P: practise · X: menu' : 'Enter: play again · X: menu', {
      ...style, fontSize: 18,
    }).setOrigin(0.5, 0);
    this.game.canvas.focus({ preventScroll: true });
    canvasShortcuts(this, { enter: playAgain, x: menu, ...(reviewCount ? { p: practise } : {}) });
    // The public callback remains compatible and fires once for each completed game.
    options.onGameOver?.({ score: summary.score });
  }
}
