import type Phaser from 'phaser';
import { GAME } from '../config';
import type { SubmitAnswer } from '../core/types';
import AnswerEntry from '../ui/AnswerEntry';
import InputButton from '../ui/InputButton';
import type { PlayerInput } from './types';

export default class KeyboardInput implements PlayerInput {
  private readonly entry: AnswerEntry;
  private readonly canvas: HTMLCanvasElement;

  constructor(private readonly scene: Phaser.Scene, private readonly submit: SubmitAnswer) {
    this.entry = new AnswerEntry(scene, false);
    this.canvas = scene.game.canvas;
    this.canvas.addEventListener('keydown', this.onKey);
    ['ä', 'ö', 'ü', 'ß'].forEach((character, index) => {
      new InputButton(scene, GAME.width / 2 - 160 + 80 * index, GAME.height - 55, character, () => this.append(character));
    });
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    if (!this.scene.scene.isActive() || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.entry.set(this.entry.value.slice(0, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.submit(this.entry.value);
      this.clear();
    } else if (/^[a-zäöüß ]$/i.test(event.key)) {
      event.preventDefault();
      this.append(event.key);
    } else if (/^[1-4]$/.test(event.key)) {
      event.preventDefault();
      this.append(['ä', 'ö', 'ü', 'ß'][Number(event.key) - 1] ?? '');
    }
  };

  private append(text: string): void {
    this.entry.set(this.entry.value + text);
    if (text.trim()) this.scene.sound.playAudioSprite('sfx', 'smb_stomp');
  }

  clear(): void { this.entry.set(''); }
  pause(): void { /* DOM input is gated on scene activity. */ }
  dispose(): void { this.canvas.removeEventListener('keydown', this.onKey); }
}
