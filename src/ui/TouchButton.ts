import Phaser from 'phaser';
import { COLORS } from '../config';
import { fitText } from './fitText';

/** A fixed-size touch target; the whole tile responds, including around its label. */
export default class TouchButton extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private pressedPointer?: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number,
    private readonly fontSize: number, onPress: () => void) {
    super(scene, x, y);
    scene.add.existing(this);
    this.background = scene.add.rectangle(0, 0, width, height, 0x203b48).setStrokeStyle(2, 0x4ceaee);
    this.label = scene.add.text(0, 0, '', { color: COLORS.button, fontSize, align: 'center' }).setOrigin(0.5);
    this.add([this.background, this.label]);
    this.setSize(width, height).setDepth(12);
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pressedPointer = pointer.id;
      this.background.setFillStyle(0x36596a).setStrokeStyle(3, 0xffff00);
      this.label.setColor(COLORS.answer);
    });
    this.on('pointerout', () => this.cancelPress());
    this.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const pressed = this.pressedPointer === pointer.id;
      this.cancelPress();
      if (pressed) onPress();
    });
    this.setEnabled(true);
  }

  cancelPress(): void {
    this.pressedPointer = undefined;
    this.background.setFillStyle(0x203b48).setStrokeStyle(2, 0x4ceaee);
    this.label.setColor(COLORS.button);
  }

  setLabel(value: string): this {
    this.label.setText(value);
    fitText(this.label, this.width - 24, this.height - 20, this.fontSize);
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.cancelPress();
    if (enabled) this.setInteractive({ useHandCursor: true });
    else this.disableInteractive();
    this.setAlpha(enabled ? 1 : 0.4);
    return this;
  }
}
