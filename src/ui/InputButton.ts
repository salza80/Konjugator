import Phaser from 'phaser';
import { COLORS } from '../config';

export default class InputButton extends Phaser.GameObjects.Text {
  private pressedPointer?: number;
  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onPress: () => void, fontSize = 60) {
    super(scene, x, y, label, { color: COLORS.button, fontSize });
    scene.add.existing(this);
    this.setShadow(2, 2, '#867470', 2, true, true);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setColor(COLORS.answer));
    this.on('pointerout', () => { this.pressedPointer = undefined; this.setColor(COLORS.button); });
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pressedPointer = pointer.id;
      this.setColor(COLORS.answer);
    });
    this.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const pressed = this.pressedPointer === pointer.id;
      this.pressedPointer = undefined;
      this.setColor(COLORS.button);
      if (pressed) onPress();
    });
  }
}
