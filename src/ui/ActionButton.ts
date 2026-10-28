import type Phaser from 'phaser';
import InputButton from './InputButton';

/** Shared secondary controls stay tappable when the canvas fits a phone. */
export default class ActionButton extends InputButton {
  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onPress: () => void, width = 200) {
    super(scene, x, y, label, onPress, 28);
    this.setFixedSize(width, 88).setPadding(12, 26).setAlign('center').setBackgroundColor('#203e40');
  }

  setEnabled(enabled: boolean): this {
    if (enabled) this.setInteractive({ useHandCursor: true });
    else this.disableInteractive();
    return this.setAlpha(enabled ? 1 : 0.4);
  }
}
