import Phaser from 'phaser';
import { createPlayfield, GAME } from '../config';
import type { PlayData, ResultData } from '../core/types';
import GameSession from '../game/GameSession';
import KeyboardInput from '../input/KeyboardInput';
import TouchInput from '../input/TouchInput';
import VoiceInput from '../input/VoiceInput';
import type { PlayerInput } from '../input/types';
import { checkOrientation, setupOrientation } from '../platform/orientation';
import { supportsSpeechRecognition } from '../platform/speech';
import GameHud from '../ui/GameHud';
import InputButton from '../ui/InputButton';

export default class GameScene extends Phaser.Scene {
  private ready!: PlayData;
  session!: GameSession;

  constructor() { super('GameScene'); }

  init(data: PlayData): void { this.ready = data; }

  create(): void {
    const fallback = this.ready.inputMode === 'Voice' && !supportsSpeechRecognition();
    const mode = fallback ? 'Keyboard' : this.ready.inputMode;
    const bounds = createPlayfield(mode);
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    this.input.on('pointerdown', () => this.game.canvas.focus({ preventScroll: true }));
    setupOrientation(this);

    const hud = new GameHud(this, bounds, this.ready.options.startText, mode);
    this.session = new GameSession(this, this.ready.words, bounds, mode, hud, (score) => {
      const result: ResultData = { options: this.ready.options, words: this.ready.words, score };
      this.scene.start('GameOver', result);
    });
    let input: PlayerInput;
    if (mode === 'Touch') {
      input = new TouchInput(this, this.ready.words, bounds, this.session.submit, (target) => this.session.spawner.highlight(target));
    } else if (mode === 'Voice') {
      input = new VoiceInput(this, this.session.submit);
    } else {
      input = new KeyboardInput(this, this.session.submit);
    }
    this.session.attachInput(input);
    if (fallback) hud.showNotice('Voice input is unavailable in this browser. Keyboard input is enabled.');

    this.add.image(GAME.width - 30, 25, 'maximize').setDisplaySize(50, 50).setDepth(3)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.scale.isFullscreen) this.scale.stopFullscreen();
        else this.scale.startFullscreen();
      });
    new InputButton(this, 20, 10, 'Menu', () => {
      this.scene.start('TitleScene', { options: this.ready.options, words: this.ready.words });
    }, 20).setDepth(3);

    const onPause = (): void => this.session.pause();
    const onBlur = (): void => this.session.pause();
    this.events.on('pause', onPause);
    this.game.events.on('blur', onBlur);
    this.events.once('shutdown', () => {
      this.events.off('pause', onPause);
      this.game.events.off('blur', onBlur);
      this.session.dispose();
      hud.dispose();
    });
    this.session.startLevel();
    checkOrientation(this);
  }
}
