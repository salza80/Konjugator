import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import { SCORING } from '../core/rules';
import { WAVES } from '../core/pacing';
import FeedbackBanner from './FeedbackBanner';
import type { CorrectionKind, FeedbackKind } from './FeedbackBanner';
import type { InputMode, Playfield, Word } from '../core/types';
import { fitText } from './fitText';

const HELP: Record<InputMode, string> = {
  Keyboard: 'Type an answer and press Enter. Edit with Backspace. Use the buttons or F1–F4 for ä, ö, ü, ß.',
  Touch: 'Select a question, then tap the character groups to answer.',
  Voice: 'Press Talk, then say the answer.',
};

export default class GameHud {
  private readonly score: Phaser.GameObjects.Text;
  private readonly level: Phaser.GameObjects.Text;
  private readonly wave: Phaser.GameObjects.Text;
  private readonly streak: Phaser.GameObjects.Text;
  private readonly health: Phaser.GameObjects.Text;
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private readonly roundGoal: Phaser.GameObjects.Text;
  private readonly feedback: FeedbackBanner;
  private readonly intro: Phaser.GameObjects.Text;
  private readonly countdown: Phaser.GameObjects.Text;
  private readonly help: Phaser.GameObjects.Text;
  private readonly baseHelp: Phaser.GameObjects.Text;
  private readonly healthX: number;
  private readonly healthWidth = 240;
  private waveMessage = '';
  private milestoneShowing = false;
  private milestoneTimer?: Phaser.Time.TimerEvent;
  private countdownLevel = 0;

  constructor(private readonly scene: Phaser.Scene, bounds: Playfield, startText: string, mode: InputMode) {
    const style = { color: '#e9f1f7', fontSize: 28 };
    const center = (bounds.left + bounds.right) / 2;
    const statusX = 250;
    this.healthX = center - this.healthWidth / 2;
    scene.add.rectangle(0, 0, GAME.width, GAME.hudHeight, 0x101923).setOrigin(0).setDepth(10);
    this.score = scene.add.text(1140, 54, 'Score: 0', style).setOrigin(1, 0).setDepth(11);
    this.streak = scene.add.text(1140, 16, '', { ...style, fontSize: 24 }).setOrigin(1, 0).setDepth(11);
    this.wave = scene.add.text(statusX, 16, '', { ...style, fontSize: 24 }).setDepth(11);
    this.level = scene.add.text(statusX, 54, '', style).setDepth(11);
    this.health = scene.add.text(center, 12, '', { ...style, fontSize: 26 }).setOrigin(0.5, 0).setDepth(11);
    this.healthBar = scene.add.graphics().setDepth(11);
    this.roundGoal = scene.add.text(center, 70, '', { ...style, fontSize: 24 }).setOrigin(0.5, 0).setDepth(11);
    this.feedback = new FeedbackBanner(scene, 750, 1000);
    this.intro = scene.add.text(bounds.left + 60, 240, startText, {
      ...style, fontSize: 30, wordWrap: { width: bounds.width - 150 },
    });
    this.countdown = scene.add.text(bounds.left + 60, 300, '', { ...style, fontSize: 30 });
    this.help = scene.add.text(bounds.left + 60, 355, HELP[mode], {
      ...style, wordWrap: { width: bounds.width - 150 },
    });
    this.baseHelp = scene.add.text(center, 465, `Missed falling word: −1 health. Orange bonuses are optional.\nCorrect answers: ${SCORING.basePoints} points + target bonus.\nStreak milestones can repair missing health.`, {
      ...style, fontSize: 22, align: 'center', wordWrap: { width: bounds.width - 150 },
    }).setOrigin(0.5, 0);
    fitText(this.intro, bounds.width - 120, 48, 30);
    fitText(this.help, bounds.width - 120, 90, 26);
  }

  showCountdown(level: number, seconds: number, practiceTotal = 0, showInstructions = true): void {
    if (this.countdownLevel !== level) {
      this.countdownLevel = level;
      this.milestoneTimer?.remove();
      this.milestoneShowing = false;
      this.wave.setColor('#e9f1f7');
      if (level === 1) this.feedback.clear();
    }
    this.wave.setVisible(false);
    this.level.setText(practiceTotal ? 'Practice' : `Level ${level}`);
    for (const text of [this.intro, this.help, this.baseHelp]) text.setVisible(showInstructions);
    this.countdown.setVisible(true);
    this.countdown.setText(practiceTotal ? `Practising ${practiceTotal} words in ${seconds}` : `Starting Level ${level} in ${seconds}`);
  }

  showLevel(level: number, seconds: number): void {
    for (const text of [this.intro, this.countdown, this.help, this.baseHelp]) text.setVisible(false);
    this.level.setText(`Level ${level} · ${seconds}s`);
    fitText(this.level, 250, 34, 28);
  }

  showPractice(completed: number, total: number, waiting = false): void {
    this.level.setText(`Practice: ${completed}/${total}`);
    fitText(this.level, 250, 34, 28);
    this.setWave(waiting ? 'Recall soon' : 'Recall without help');
  }

  showLevelClosing(level: number, seconds: number, remaining: number): void {
    this.level.setText(seconds ? `Level ${level} · ${seconds}s` : `Level ${level} · End`);
    fitText(this.level, 250, 34, 28);
    this.setWave(remaining
      ? `${remaining} left · then next level`
      : 'Next level shortly');
  }

  showWave(index: number, label: string): void {
    this.setWave(`${index + 1}/${WAVES.length} · ${label}`);
  }

  private setWave(message: string): void {
    this.waveMessage = message;
    if (!this.milestoneShowing) {
      this.wave.setText(message).setVisible(true);
      fitText(this.wave, 250, 30, 24);
    }
  }

  showMilestone(streak: number, repaired: boolean): void {
    this.milestoneTimer?.remove();
    this.milestoneShowing = true;
    this.wave.setText(`${streak} in a row!${repaired ? ' +1 health' : ''}`).setColor(COLORS.success).setVisible(true);
    fitText(this.wave, 250, 30, 24);
    this.scene.tweens.killTweensOf(this.streak);
    this.streak.setScale(1);
    this.scene.tweens.add({ targets: this.streak, scale: 1.12, duration: 180, yoyo: true, repeat: 1 });
    this.milestoneTimer = this.scene.time.delayedCall(1800, () => {
      this.milestoneShowing = false;
      this.wave.setColor('#e9f1f7').setText(this.waveMessage);
      fitText(this.wave, 250, 30, 24);
    });
  }

  showScore(score: number): void {
    this.score.setText(`Score: ${score}`);
    fitText(this.score, 330, 34, 28);
  }

  showRoundGoal(correct: number, goal: number): void {
    this.roundGoal.setText(goal ? `Goal: ${correct}/${goal} correct` : '');
    fitText(this.roundGoal, 280, 30, 24);
  }

  showStreak(streak: number, bonus: number): void {
    this.streak.setText(`Streak: ${streak}${bonus > 0 ? ` · +${bonus}` : ''}`);
    fitText(this.streak, 330, 30, 24);
    this.streak.setColor(bonus > 0 ? '#ffcf70' : '#e9f1f7');
  }

  showHealth(remaining: number, total: number): void {
    const fraction = Phaser.Math.Clamp(remaining / total, 0, 1);
    const low = fraction <= 0.25;
    const color = low ? 0xff8888 : fraction <= 0.5 ? 0xffcf70 : 0x8ff0a4;
    this.health.setText(`Health: ${remaining}/${total}${low ? ' LOW' : ''}`);
    this.health.setColor(low ? COLORS.error : '#e9f1f7');
    this.healthBar.clear();
    this.healthBar.fillStyle(0x344554).fillRoundedRect(this.healthX, 48, this.healthWidth, 16, 5);
    if (fraction > 0) this.healthBar.fillStyle(color).fillRoundedRect(this.healthX, 48, this.healthWidth * fraction, 16, 5);
  }

  showFeedback(message: string, kind: FeedbackKind, word?: Word): void {
    this.feedback.showStatus(message, kind, false, word);
  }

  showCorrection(word: Word, kind: CorrectionKind): void {
    this.feedback.showCorrection(word, kind);
  }

  get lastCorrection(): Word | undefined { return this.feedback.lastCorrection; }

  revealReadingWord(): Word | undefined {
    const word = this.feedback.lastShownWord;
    if (word) this.feedback.onDisplay?.(word);
    return word;
  }

  onCorrectionShown(listener?: (word: Word) => void): void { this.feedback.onDisplay = listener; }

  showInputMode(mode: InputMode): void { this.help.setText(HELP[mode]); }

  showNotice(message: string): void {
    this.feedback.showStatus(message, 'error', true);
  }

  dispose(): void {
    this.milestoneTimer?.remove();
    this.feedback.destroy();
  }
}
