import Phaser from 'phaser';
import { COLORS } from '../config';

export default class InputButton extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onPress: () => void, fontSize = 60) {
    super(scene, x, y, label, { color: COLORS.button, fontSize });
    scene.add.existing(this);
    this.setShadow(2, 2, '#867470', 2, true, true);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setColor(COLORS.answer));
    this.on('pointerout', () => this.setColor(COLORS.button));
    this.on('pointerdown', () => this.setColor(COLORS.answer));
    this.on('pointerup', onPress);
  }
}
