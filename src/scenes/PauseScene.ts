import Phaser from 'phaser';
import { GAME } from '../config';
import { isPortrait } from '../platform/orientation';
import { canvasShortcuts } from '../platform/keyboard';
import { onSceneEnd } from '../platform/lifecycle';
import InputButton from '../ui/InputButton';
import SoundButton from '../ui/SoundButton';

/** Runs above the paused game; only an explicit Continue resumes its clocks. */
export default class PauseScene extends Phaser.Scene {
  private focusOverlay = false;
  constructor() { super('PauseScene'); }

  init(data: { focusOverlay?: boolean }): void { this.focusOverlay = data.focusOverlay === true; }

  create(): void {
    const center = GAME.width / 2;
    this.scene.bringToTop();
    this.add.rectangle(0, 0, GAME.width, GAME.height, 0x101923, 0.94).setOrigin(0);
    this.add.text(center, 205, 'PAUSED', { color: '#e9f1f7', fontSize: 48 }).setOrigin(0.5);
    const message = this.add.text(center, 290, '', {
      color: '#e9f1f7', fontSize: 24, align: 'center', wordWrap: { width: 900 },
    }).setOrigin(0.5);
    let continuing = false;
    const needsLandscape = (): boolean => !this.game.device.os.desktop && isPortrait();
    const resume = (): void => {
      if (continuing || needsLandscape() || document.hidden || !document.hasFocus()) return;
      continuing = true;
      this.game.canvas.focus({ preventScroll: true });
      this.scene.resume('GameScene');
      this.scene.stop();
    };
    const continueButton = new InputButton(this, center, 380, 'Continue', resume, 36).setOrigin(0.5).setPadding(24, 14).setBackgroundColor('#203e40');
    if (this.focusOverlay) this.game.canvas.focus({ preventScroll: true });
    canvasShortcuts(this, { enter: resume, ' ': resume, escape: resume });
    new SoundButton(this, center, 480).setOrigin(0.5);
    const render = (): void => {
      const portrait = needsLandscape();
      message.setText(portrait
        ? 'Rotate your device to landscape to continue.'
        : 'Continue when you’re ready. Enter or Escape also resumes.');
      continueButton.setVisible(!portrait);
      if (portrait) continueButton.disableInteractive();
      else continueButton.setInteractive({ useHandCursor: true });
    };
    this.scale.on('orientationchange', render);
    this.scale.on('resize', render);
    onSceneEnd(this, () => {
      this.scale.off('orientationchange', render);
      this.scale.off('resize', render);
    });
    render();
  }
}
