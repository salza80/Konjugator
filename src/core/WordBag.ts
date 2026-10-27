import type { Word } from './types';
import { wordKey } from './words';

/** Session-owned coverage, shared by every target kind and retained across levels. */
export default class WordBag {
  private remaining: Word[] = [];
  private lastKey?: string;

  constructor(private readonly random: () => number) {}

  defer(word: Word): void {
    if (!this.remaining.some((candidate) => wordKey(candidate) === wordKey(word))) this.remaining.unshift(word);
  }

  recordSpawn(word: Word): void { this.lastKey = wordKey(word); }

  next(words: readonly Word[], activeWords: readonly Word[]): Word | undefined {
    const pool = new Map(words.map((word) => [wordKey(word), word]));
    // Practice removes completed items from its pool while a bag is in progress.
    this.remaining = this.remaining.filter((word) => pool.has(wordKey(word)));
    if (!this.remaining.length) {
      this.remaining = [...pool.values()];
      for (let index = this.remaining.length - 1; index > 0; index--) {
        const swap = Math.floor(this.random() * (index + 1));
        const current = this.remaining[index];
        const other = this.remaining[swap];
        if (current && other) {
          this.remaining[index] = other;
          this.remaining[swap] = current;
        }
      }
    }
    const active = new Set(activeWords.map(wordKey));
    let index = this.remaining.findIndex((word) => !active.has(wordKey(word)) && wordKey(word) !== this.lastKey);
    if (index < 0) index = this.remaining.findIndex((word) => !active.has(wordKey(word)));
    // Wait for blocked bag entries rather than repeating already-covered alternatives.
    // Tiny pools may repeat when every available question is already active.
    if (index < 0 && [...pool.keys()].every((key) => active.has(key))) index = 0;
    if (index < 0) return undefined;
    const word = this.remaining.splice(index, 1)[0];
    return word;
  }
}
