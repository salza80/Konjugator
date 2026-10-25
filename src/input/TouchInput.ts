import Phaser from 'phaser';
import { GAME } from '../config';
import { characterChoices, touchProgress } from '../core/answers';
import type { Playfield, SubmitAnswer, Word } from '../core/types';
import { allCharacters } from '../core/words';
import type WordTarget from '../entities/WordTarget';
import AnswerEntry from '../ui/AnswerEntry';
import InputButton from '../ui/InputButton';
import type { PlayerInput } from './types';

export default class TouchInput implements PlayerInput {
  private readonly entry: AnswerEntry;
  private readonly buttons = new Map<string, InputButton>();
  private readonly characters: string[];
  private selected?: WordTarget;

  constructor(private readonly scene: Phaser.Scene, words: readonly Word[], private readonly bounds: Playfield,
    private readonly submit: SubmitAnswer, private readonly highlight: (target?: WordTarget) => void) {
    this.entry = new AnswerEntry(scene, true);
    this.characters = allCharacters(words);
    const background = scene.add.graphics().fillStyle(0x000000).setDepth(1);
    background.fillRect(0, 0, bounds.sideWidth, bounds.height);
    background.fillRect(bounds.right, 0, bounds.sideWidth, bounds.height);
    for (const character of this.characters) {
      this.buttons.set(character, new InputButton(scene, 0, 0, character, () => this.append(character), 100)
        .setDepth(2).setVisible(false).setActive(false));
    }
  }

  select(target: WordTarget): void {
    this.selected = target;
    this.entry.set('');
    this.highlight(target);
    this.showChoices();
  }

  remove(target: WordTarget): void {
    if (target === this.selected) this.clear();
  }

  private append(character: string): void {
    if (!this.selected || this.selected.state === 'resolved') return;
    const progress = touchProgress(this.selected.word.answer, this.entry.value + character);
    if (progress === null) {
      this.scene.cameras.main.shake(100, 0.05);
      this.scene.sound.playAudioSprite('sfx', 'smb_bump');
      return;
    }
    this.entry.set(progress);
    this.scene.sound.playAudioSprite('sfx', 'smb_stomp');
    if (progress === this.selected.word.answer) {
      this.submit(progress);
      this.clear();
    }
  }

  private showChoices(): void {
    for (const button of this.buttons.values()) button.setVisible(false).setActive(false);
    if (!this.selected) return;
    const choices = characterChoices(this.selected.word.answer, this.characters, (items) => Phaser.Utils.Array.Shuffle(items));
    const spacing = (GAME.height - 60) / (Math.ceil(choices.length / 2) + 1);
    choices.forEach((character, index) => {
      const button = this.buttons.get(character);
      if (!button) return;
      const x = index % 2 === 0 ? this.bounds.sideWidth / 2 : GAME.width - this.bounds.sideWidth / 2;
      button.setOrigin(0.5).setPosition(x, 60 + (Math.floor(index / 2) + 1) * spacing).setActive(true).setVisible(true);
    });
  }

  clear(): void {
    this.selected = undefined;
    this.entry.set('');
    this.highlight();
    this.showChoices();
  }

  pause(): void { /* Phaser pauses pointer input together with the scene. */ }
  dispose(): void { this.selected = undefined; }
}
