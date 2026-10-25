import Phaser from 'phaser';
import { COLORS, GAME } from '../config';

export default class AnswerEntry {
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, large: boolean) {
    this.label = scene.add.text(GAME.width / 2, GAME.height - GAME.bottomSpace, '', {
      color: COLORS.text,
      fontSize: large ? 80 : 30,
    }).setOrigin(0.5, 0);
  }

  get value(): string {
    return this.label.text;
  }

  set(value: string): void {
    if (this.label.scene) this.label.setText(value);
  }
}
