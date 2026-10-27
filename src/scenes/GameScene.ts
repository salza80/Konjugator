import Phaser from 'phaser';
import { createPlayfield, GAME } from '../config';
import type { PlayData, ResultData, SessionMode } from '../core/types';
import GameSession from '../game/GameSession';
import KeyboardInput from '../input/KeyboardInput';
import TouchInput from '../input/TouchInput';
import VoiceInput from '../input/VoiceInput';
import type { PlayerInput } from '../input/types';
import { checkOrientation, setupOrientation } from '../platform/orientation';
import { supportsSpeechRecognition } from '../platform/speech';
import { canvasShortcuts, hasGameFocus } from '../platform/keyboard';
import { onSceneEnd } from '../platform/lifecycle';
import GameHud from '../ui/GameHud';
import InputButton from '../ui/InputButton';
import SoundButton from '../ui/SoundButton';

export default class GameScene extends Phaser.Scene {
  private ready!: PlayData;
  session!: GameSession;

  constructor() { super('GameScene'); }

  init(data: PlayData): void { this.ready = data; }

  create(): void {
    const fallback = this.ready.inputMode === 'Voice' && !supportsSpeechRecognition();
    let mode = fallback ? 'Keyboard' : this.ready.inputMode;
    const bounds = createPlayfield(mode);
    const practiceWords = this.ready.practiceWords?.length ? this.ready.practiceWords : undefined;
    const sessionWords = practiceWords ?? this.ready.words;
    const sessionMode: SessionMode = practiceWords ? { kind: 'practice', words: practiceWords }
      : this.ready.options.roundGoal ? { kind: 'goal', target: this.ready.options.roundGoal }
        : { kind: 'survival' };
    this.game.canvas.tabIndex = 0;
    this.game.canvas.focus({ preventScroll: true });
    let pauseRequested = false;
    const pauseGame = (): void => {
      if (pauseRequested || !this.scene.isActive() || this.session.phase === 'over') return;
      pauseRequested = true;
      const focusOverlay = hasGameFocus(this.game) && document.hasFocus();
      this.session.pause();
      this.scene.pause();
      this.scene.launch('PauseScene', { focusOverlay });
    };
    setupOrientation(this, pauseGame);

    const hud = new GameHud(this, bounds, this.ready.options.startText, mode);
    this.session = new GameSession(this, sessionWords, bounds, mode, hud, (summary) => {
      const result: ResultData = {
        options: this.ready.options, words: this.ready.words, inputMode: mode, summary,
        lastCorrection: hud.lastCorrection,
      };
      this.scene.start('GameOver', result);
    }, sessionMode);
    const digitShortcuts = !sessionWords.some((word) => /[1-4]/.test(word.answer));
    let input: PlayerInput;
    if (mode === 'Touch') {
      input = new TouchInput(this, sessionWords, bounds, this.session.submit,
        (target) => this.session.spawner.highlight(target),
        (word) => this.session.rejectAnswer('Try another character group. Health unchanged.', word));
    } else if (mode === 'Voice') {
      input = new VoiceInput(this, this.session.submit, () => {
        mode = 'Keyboard';
        this.session.attachInput(new KeyboardInput(this, this.session.submit, digitShortcuts), mode);
        hud.showInputMode(mode);
        hud.showNotice('Keyboard enabled. Type an answer and press Enter.');
      });
    } else {
      input = new KeyboardInput(this, this.session.submit, digitShortcuts);
    }
    this.session.attachInput(input);

    this.add.image(GAME.width - 30, 25, 'maximize').setDisplaySize(50, 50).setDepth(12)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.scale.isFullscreen) this.scale.stopFullscreen();
        else this.scale.startFullscreen();
      });
    new InputButton(this, 20, 10, 'Menu', () => {
      this.scene.start('TitleScene', { options: this.ready.options, words: this.ready.words });
    }, 20).setDepth(12);
    new InputButton(this, 20, 88, 'Pause', pauseGame, 20).setDepth(12);
    new SoundButton(this, 20, 54).setDepth(12);

    const onPause = (): void => this.session.pause();
    const onResume = (): void => { pauseRequested = false; this.session.resume(); };
    let ended = false;
    const onFocusOut = (): void => queueMicrotask(() => {
      if (!ended && !hasGameFocus(this.game)) pauseGame();
    });
    canvasShortcuts(this, { escape: pauseGame });
    this.events.on('pause', onPause);
    this.events.on('resume', onResume);
    this.game.events.on('blur', pauseGame);
    this.game.events.on('hidden', pauseGame);
    document.addEventListener('focusout', onFocusOut);
    onSceneEnd(this, () => {
      ended = true;
      this.events.off('pause', onPause);
      this.events.off('resume', onResume);
      this.game.events.off('blur', pauseGame);
      this.game.events.off('hidden', pauseGame);
      document.removeEventListener('focusout', onFocusOut);
      if (this.sys.settings.status !== Phaser.Scenes.DESTROYED) this.scene.stop('PauseScene');
      this.session.dispose();
      hud.dispose();
    });
    this.session.startLevel();
    if (fallback) hud.showNotice('Voice unavailable. Keyboard enabled.');
    checkOrientation(this, pauseGame);
  }
}
