import Phaser from 'phaser';
import { characterChoices, touchProgress } from '../core/answers';
import type { Playfield, SubmitAnswer, Word } from '../core/types';
import { allCharacters } from '../core/words';
import type WordTarget from '../entities/WordTarget';
import AnswerEntry from '../ui/AnswerEntry';
import TouchChoicePanel from '../ui/TouchChoicePanel';
import type { PlayerInput } from './types';

export default class TouchInput implements PlayerInput {
  private readonly entry: AnswerEntry;
  private readonly controls: TouchChoicePanel;
  private readonly characters: string[];
  private selected?: WordTarget;

  constructor(private readonly scene: Phaser.Scene, words: readonly Word[], bounds: Playfield,
    private readonly submit: SubmitAnswer, private readonly highlight: (target?: WordTarget) => void,
    private readonly onIncorrect: (word: Word) => void) {
    this.entry = new AnswerEntry(scene, true);
    this.characters = allCharacters(words);
    this.controls = new TouchChoicePanel(scene, bounds, (character) => this.append(character));
  }

  select(target: WordTarget): void {
    if (!target.isPlayable || target === this.selected) return;
    this.selected = target;
    this.entry.set('');
    this.highlight(target);
    this.showChoices();
  }

  remove(target: WordTarget): void {
    if (target === this.selected) this.clear();
  }

  private append(character: string): void {
    if (!this.selected) return;
    if (!this.selected.isPlayable) {
      this.clear();
      return;
    }
    const progress = touchProgress(this.selected.word.answer, this.entry.value + character);
    if (progress === null) {
      this.onIncorrect(this.selected.word);
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
    this.controls.show(this.selected
      ? characterChoices(this.selected.word.answer, this.characters, (items) => Phaser.Utils.Array.Shuffle(items))
      : []);
  }

  clear(): void {
    this.selected = undefined;
    this.entry.set('');
    this.highlight();
    this.showChoices();
  }

  pause(): void { this.controls.cancelPress(); }
  dispose(): void {
    this.selected = undefined;
    this.controls.destroy();
    this.entry.destroy();
  }
}
