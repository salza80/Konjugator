import Phaser from 'phaser';
import type { InputMode, PlayData, ReadyData } from '../core/types';
import { checkOrientation, enterMobileFullscreen, setupOrientation } from '../platform/orientation';
import InputButton from '../ui/InputButton';

export default class TitleScene extends Phaser.Scene {
  private ready!: ReadyData;

  constructor() { super('TitleScene'); }

  init(ready: ReadyData): void { this.ready = ready; }

  create(): void {
    setupOrientation(this);
    this.scene.bringToTop();
    if (this.ready.options.inputMode) {
      const mode = this.ready.options.inputMode;
      new InputButton(this, 200, 200, 'START GAME', () => this.play(mode));
    } else {
      const choices: { mode: InputMode; label: string; y: number }[] = [
        { mode: 'Touch', label: 'START (mobile input)', y: 100 },
        { mode: 'Keyboard', label: 'START (keyboard input)', y: 300 },
        { mode: 'Voice', label: 'START (voice input)', y: 500 },
      ];
      for (const choice of choices) new InputButton(this, 200, choice.y, choice.label, () => this.play(choice.mode));
    }
    checkOrientation(this);
  }

  private play(inputMode: InputMode): void {
    enterMobileFullscreen(this);
    const data: PlayData = { ...this.ready, inputMode };
    this.scene.start('GameScene', data);
  }
}
