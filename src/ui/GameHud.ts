import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import { SCORING } from '../core/rules';
import { WAVES } from '../core/pacing';
import FeedbackBanner from './FeedbackBanner';
import type { CorrectionKind, FeedbackKind } from './FeedbackBanner';
import type { InputMode, Playfield, Word } from '../core/types';

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

  constructor(private readonly scene: Phaser.Scene, bounds: Playfield, startText: string, mode: InputMode) {
    const style = { color: '#e9f1f7', fontSize: 20 };
    const center = (bounds.left + bounds.right) / 2;
    const statusX = Math.max(150, bounds.left);
    this.healthX = center - this.healthWidth / 2;
    scene.add.rectangle(0, 0, GAME.width, GAME.hudHeight, 0x101923).setOrigin(0).setDepth(10);
    this.score = scene.add.text(bounds.right - 20, 54, 'Score: 0', style).setOrigin(1, 0).setDepth(11);
    this.streak = scene.add.text(bounds.right - 80, 20, '', { ...style, fontSize: 18 }).setOrigin(1, 0).setDepth(11);
    this.wave = scene.add.text(statusX, 20, '', { ...style, fontSize: 16 }).setDepth(11);
    this.level = scene.add.text(statusX, 54, '', style).setDepth(11);
    this.health = scene.add.text(center, 18, '', style).setOrigin(0.5, 0).setDepth(11);
    this.healthBar = scene.add.graphics().setDepth(11);
    this.roundGoal = scene.add.text(center, 68, '', { ...style, fontSize: 16 }).setOrigin(0.5, 0).setDepth(11);
    this.feedback = new FeedbackBanner(scene, center, bounds.width - 220);
    this.intro = scene.add.text(bounds.left + 100, 200, startText, {
      ...style, fontSize: 30, wordWrap: { width: bounds.width - 150 },
    });
    this.countdown = scene.add.text(bounds.left + 100, 250, '', { ...style, fontSize: 30 });
    this.help = scene.add.text(bounds.left + 100, 310, HELP[mode], {
      ...style, wordWrap: { width: bounds.width - 150 },
    });
    this.baseHelp = scene.add.text(center, 400, `Missed falling word: −1 health. Orange bonuses are optional.\nCorrect answers: ${SCORING.basePoints} points + target bonus.\nStreak milestones can repair missing health.`, {
      ...style, fontSize: 22, align: 'center', wordWrap: { width: bounds.width - 150 },
    }).setOrigin(0.5, 0);
  }

  showCountdown(level: number, seconds: number, practiceTotal = 0): void {
    this.milestoneTimer?.remove();
    this.milestoneShowing = false;
    this.wave.setColor('#e9f1f7');
    if (level === 1) this.feedback.clear();
    this.wave.setVisible(false);
    this.level.setText(practiceTotal ? 'Practice' : `Level ${level}`);
    for (const text of [this.intro, this.help, this.baseHelp]) text.setVisible(level === 1);
    this.countdown.setVisible(true);
    this.countdown.setText(practiceTotal ? `Practising ${practiceTotal} words in ${seconds}` : `Starting Level ${level} in ${seconds}`);
  }

  showLevel(level: number, seconds: number): void {
    for (const text of [this.intro, this.countdown, this.help, this.baseHelp]) text.setVisible(false);
    this.level.setText(`Level ${level} · ${seconds}s`);
  }

  showPractice(completed: number, total: number, waiting = false): void {
    this.level.setText(`Practice: ${completed}/${total}`);
    this.setWave(waiting ? 'Recall after this break' : 'Recall without help');
  }

  showLevelClosing(level: number, seconds: number, remaining: number): void {
    this.level.setText(seconds ? `Level ${level} · ${seconds}s` : `Level ${level} · Finishing`);
    this.setWave(remaining
      ? `Finish remaining words · ${remaining} left`
      : 'Next level shortly');
  }

  showWave(index: number, label: string): void {
    this.setWave(`Wave ${index + 1}/${WAVES.length} · ${label}`);
  }

  private setWave(message: string): void {
    this.waveMessage = message;
    if (!this.milestoneShowing) this.wave.setText(message).setVisible(true);
  }

  showMilestone(streak: number, repaired: boolean): void {
    this.milestoneTimer?.remove();
    this.milestoneShowing = true;
    this.wave.setText(`${streak} in a row!${repaired ? ' +1 health' : ''}`).setColor(COLORS.success).setVisible(true);
    this.scene.tweens.killTweensOf(this.streak);
    this.streak.setScale(1);
    this.scene.tweens.add({ targets: this.streak, scale: 1.12, duration: 180, yoyo: true, repeat: 1 });
    this.milestoneTimer = this.scene.time.delayedCall(1800, () => {
      this.milestoneShowing = false;
      this.wave.setColor('#e9f1f7').setText(this.waveMessage);
    });
  }

  showScore(score: number): void {
    this.score.setText(`Score: ${score}`);
  }

  showRoundGoal(correct: number, goal: number): void {
    this.roundGoal.setText(goal ? `Goal: ${correct}/${goal} correct` : '');
  }

  showStreak(streak: number, bonus: number): void {
    this.streak.setText(`Streak: ${streak}${bonus > 0 ? ` · +${bonus} bonus` : ''}`);
    this.streak.setColor(bonus > 0 ? '#ffcf70' : '#e9f1f7');
  }

  showHealth(remaining: number, total: number): void {
    const fraction = Phaser.Math.Clamp(remaining / total, 0, 1);
    const low = fraction <= 0.25;
    const color = low ? 0xff8888 : fraction <= 0.5 ? 0xffcf70 : 0x8ff0a4;
    this.health.setText(`Base health: ${remaining}/${total}${low ? ' · LOW' : ''}`);
    this.health.setColor(low ? COLORS.error : '#e9f1f7');
    this.healthBar.clear();
    this.healthBar.fillStyle(0x344554).fillRoundedRect(this.healthX, 48, this.healthWidth, 16, 5);
    if (fraction > 0) this.healthBar.fillStyle(color).fillRoundedRect(this.healthX, 48, this.healthWidth * fraction, 16, 5);
  }

  showFeedback(message: string, kind: FeedbackKind): void {
    this.feedback.showStatus(message, kind);
  }

  showCorrection(word: Word, kind: CorrectionKind): void {
    this.feedback.showCorrection(word, kind);
  }

  get lastCorrection(): Word | undefined { return this.feedback.lastCorrection; }

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
