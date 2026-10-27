import Phaser from 'phaser';
import { GAME } from '../config';
import { isPortrait } from '../platform/orientation';
import { canvasShortcuts } from '../platform/keyboard';
import { onSceneEnd } from '../platform/lifecycle';
import type { ReadyData, Word } from '../core/types';
import ActionButton from '../ui/ActionButton';
import SoundButton from '../ui/SoundButton';
import { fitText } from '../ui/fitText';
import HintPanel from '../ui/HintPanel';

interface PauseData { focusOverlay?: boolean; ready: ReadyData; readingWord?: Word }

/** Runs above the paused game; only an explicit Continue resumes its clocks. */
export default class PauseScene extends Phaser.Scene {
  private pauseData!: PauseData;
  constructor() { super('PauseScene'); }

  init(data: PauseData): void { this.pauseData = data; }

  create(): void {
    const center = GAME.width / 2;
    this.scene.bringToTop();
    this.add.rectangle(0, 0, GAME.width, GAME.height, 0x101923, 0.94).setOrigin(0);
    this.add.text(center, 90, 'PAUSED', { color: '#e9f1f7', fontSize: 48 }).setOrigin(0.5);
    const message = this.add.text(center, 155, '', {
      color: '#e9f1f7', fontSize: 28, align: 'center', wordWrap: { width: 1000 },
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
    const { readingWord } = this.pauseData;
    if (readingWord) {
      const question = this.add.text(center, 210, readingWord.question, { color: '#c0d3df', fontSize: 28, align: 'center' }).setOrigin(0.5, 0);
      const answer = this.add.text(center, 250, `Correct answer: ${readingWord.answer}`, { color: '#8ff0a4', fontSize: 34, align: 'center' }).setOrigin(0.5, 0);
      if (readingWord.tip) new HintPanel(this, center, 295, readingWord.tip);
      fitText(question, 1000, 36, 28);
      fitText(answer, 1000, 42, 34);
    }
    const continueButton = new ActionButton(this, center - 170, 490, 'Continue', resume, 260).setOrigin(0.5, 0);
    new ActionButton(this, center + 170, 490, 'Menu', () => {
      if (continuing) return;
      continuing = true;
      this.scene.stop('GameScene');
      const { options, words } = this.pauseData.ready;
      this.scene.start('TitleScene', { options, words });
    }, 260).setOrigin(0.5, 0);
    if (this.pauseData.focusOverlay) this.game.canvas.focus({ preventScroll: true });
    canvasShortcuts(this, { enter: resume, ' ': resume, escape: resume });
    new SoundButton(this, center, 590).setOrigin(0.5, 0);
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
