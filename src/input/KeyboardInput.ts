import type Phaser from 'phaser';
import { GAME } from '../config';
import type { SubmitAnswer } from '../core/types';
import { registerGameInput } from '../platform/keyboard';
import AnswerEntry from '../ui/AnswerEntry';
import InputButton from '../ui/InputButton';
import type { PlayerInput } from './types';

const UMLAUTS = ['ä', 'ö', 'ü', 'ß'];

/** A native editor supplies Unicode, IME, paste, selection and normal editing. */
export default class KeyboardInput implements PlayerInput {
  private readonly entry: AnswerEntry;
  private readonly editor: HTMLInputElement;
  private readonly buttons: InputButton[] = [];
  private readonly unregister: () => void;

  constructor(private readonly scene: Phaser.Scene, private readonly submit: SubmitAnswer, private readonly digitShortcuts = true) {
    this.entry = new AnswerEntry(scene, false);
    this.editor = document.createElement('input');
    this.editor.type = 'text';
    this.editor.autocomplete = 'off';
    this.editor.spellcheck = false;
    this.editor.setAttribute('aria-label', 'Your answer');
    this.editor.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;font-size:20px;';
    scene.game.canvas.parentElement?.append(this.editor);
    this.unregister = registerGameInput(scene.game, this.editor);
    this.editor.addEventListener('keydown', this.onKey);
    this.editor.addEventListener('input', this.onInput);
    scene.game.canvas.addEventListener('focus', this.focus);
    scene.scale.on('resize', this.positionEditor);
    window.addEventListener('scroll', this.positionEditor, true);
    this.positionEditor();
    UMLAUTS.forEach((character, index) => {
      this.buttons.push(new InputButton(scene, GAME.width / 2 - 160 + 80 * index, GAME.height - 55, character,
        () => { this.insert(character); this.focus(); }));
    });
    queueMicrotask(this.focus);
  }

  private readonly positionEditor = (): void => {
    const rect = this.scene.game.canvas.getBoundingClientRect();
    Object.assign(this.editor.style, { left: `${rect.left + rect.width * 0.1}px`, top: `${rect.top + rect.height * 0.85}px`,
      width: `${rect.width * 0.8}px`, height: '30px' });
  };

  private readonly focus = (): void => {
    if (this.editor.isConnected && this.scene.scene.isActive() && !this.editor.disabled) this.editor.focus({ preventScroll: true });
  };

  private readonly onInput = (): void => {
    if (!this.scene.scene.isActive()) return;
    this.entry.set(this.editor.value);
    this.scene.sound.playAudioSprite('sfx', 'smb_stomp');
  };

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!this.scene.scene.isActive() || event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat && this.submit(this.editor.value)) this.clear();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const shortcut = /^F[1-4]$/.test(event.key) ? Number(event.key.slice(1))
      : this.digitShortcuts && /^[1-4]$/.test(event.key) ? Number(event.key) : 0;
    if (shortcut) {
      event.preventDefault();
      this.insert(UMLAUTS[shortcut - 1] ?? '');
    }
  };

  private insert(text: string): void {
    this.editor.setRangeText(text, this.editor.selectionStart ?? this.editor.value.length,
      this.editor.selectionEnd ?? this.editor.value.length, 'end');
    this.onInput();
  }

  clear(): void { this.editor.value = ''; this.entry.set(''); }
  pause(): void { this.editor.disabled = true; }
  resume(): void { this.editor.disabled = false; this.focus(); }
  dispose(): void {
    this.editor.removeEventListener('keydown', this.onKey);
    this.editor.removeEventListener('input', this.onInput);
    this.scene.game.canvas.removeEventListener('focus', this.focus);
    this.scene.scale.off('resize', this.positionEditor);
    window.removeEventListener('scroll', this.positionEditor, true);
    this.unregister();
    this.editor.remove();
    this.entry.destroy();
    for (const button of this.buttons) button.destroy();
  }
}
