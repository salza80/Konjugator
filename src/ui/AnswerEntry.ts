import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import { fitText } from './fitText';

export default class AnswerEntry {
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, private readonly large: boolean) {
    this.label = scene.add.text(GAME.width / 2, GAME.height - GAME.bottomSpace, '', {
      color: COLORS.text,
      fontSize: large ? 80 : 30,
      align: 'center',
    }).setOrigin(0.5, 0);
  }

  destroy(): void { this.label.destroy(); }

  get value(): string {
    return this.label.text;
  }

  set(value: string): void {
    if (this.label.scene) {
      this.label.setText(value);
      fitText(this.label, GAME.width - 2 * GAME.touchSideWidth - 20, this.large ? 90 : 40, this.large ? 80 : 30);
    }
  }
}
