import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import type { InputMode, Playfield } from '../core/types';

const HELP: Record<InputMode, string> = {
  Keyboard: 'For ä, ö, ü & ß use the buttons or 1, 2, 3, 4 keys. Press Enter to fire.',
  Touch: 'Select a question, then tap the character groups to answer.',
  Voice: 'Press Talk, then say the answer.',
};

export default class GameHud {
  private readonly score: Phaser.GameObjects.Text;
  private readonly level: Phaser.GameObjects.Text;
  private readonly intro: Phaser.GameObjects.Text;
  private readonly countdown: Phaser.GameObjects.Text;
  private readonly help: Phaser.GameObjects.Text;
  private flash?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene, bounds: Playfield, startText: string, mode: InputMode) {
    const style = { color: COLORS.text, fontSize: 20 };
    this.score = scene.add.text(bounds.right - 150, 50, 'Score: 0', style);
    this.level = scene.add.text(bounds.left + 20, 50, '', style);
    this.intro = scene.add.text(bounds.left + 100, 200, startText, {
      ...style, fontSize: 30, wordWrap: { width: bounds.width - 150 },
    });
    this.countdown = scene.add.text(bounds.left + 100, 250, '', { ...style, fontSize: 30 });
    this.help = scene.add.text(bounds.left + 100, 300, HELP[mode], {
      ...style, wordWrap: { width: bounds.width - 150 },
    });
  }

  showCountdown(level: number, seconds: number): void {
    this.level.setText('');
    for (const text of [this.intro, this.countdown, this.help]) text.setVisible(true);
    this.countdown.setText(`Starting Level ${level} in ${seconds}`);
  }

  showLevel(level: number, seconds: number): void {
    for (const text of [this.intro, this.countdown, this.help]) text.setVisible(false);
    this.level.setText(`Level ${level}: ${seconds}`);
  }

  showScore(score: number, bonus: boolean): void {
    this.score.setText(`Score: ${score}`);
    if (!bonus) return;
    this.flash?.remove();
    this.score.clearTint();
    this.flash = this.scene.time.addEvent({
      delay: 100, repeat: 7,
      callback: () => this.score.isTinted ? this.score.clearTint() : this.score.setTint(0xff8888),
    });
  }

  showNotice(message: string): void {
    this.scene.add.text(100, 110, message, {
      color: COLORS.answer, fontSize: 20, wordWrap: { width: GAME.width - 200 },
    });
  }

  dispose(): void {
    this.flash?.remove();
  }
}
