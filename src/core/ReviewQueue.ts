import type { Word } from './types';
import { wordKey } from './words';

interface ReviewItem { word: Word; after: number; readyAt: number }
const SPACING = 3;
export const CORRECTION_MS = 3200;
const RECALL_DELAY_MS = CORRECTION_MS + 3200;

/** Session-local retrieval scheduling. Time is supplied by the active scene clock. */
export default class ReviewQueue {
  private readonly pending = new Map<string, ReviewItem>();
  private readonly assisted = new Set<string>();
  private readonly visibleUntil = new Map<string, number>();
  private presentations = 0;

  get words(): readonly Word[] { return [...this.pending.values()].map((item) => item.word); }

  fail(words: readonly Word[], now: number): void {
    for (const word of words) this.pending.set(wordKey(word), {
      word, after: this.presentations + SPACING, readyAt: now + RECALL_DELAY_MS,
    });
  }

  expose(word: Word, now: number): void {
    const key = wordKey(word);
    this.assisted.add(key);
    this.visibleUntil.set(key, now + CORRECTION_MS);
    const item = this.pending.get(key);
    if (item) item.readyAt = Math.max(item.readyAt, now + RECALL_DELAY_MS);
  }

  present(word: Word, active: readonly Word[], now: number): void {
    this.presentations++;
    const key = wordKey(word);
    // A duplicate cannot erase help already shown for another active copy.
    if (active.some((other) => wordKey(other) === key)) return;
    this.assisted.delete(key);
    if ((this.visibleUntil.get(key) ?? 0) > now) this.assisted.add(key);
  }

  accept(words: readonly Word[], now: number) {
    const clean: Word[] = [];
    const recovered: Word[] = [];
    let assisted = false;
    for (const word of new Map(words.map((item) => [wordKey(item), item])).values()) {
      const key = wordKey(word);
      if (this.assisted.has(key)) {
        assisted = true;
        this.fail([word], now);
      } else {
        clean.push(word);
        if (this.pending.delete(key)) recovered.push(word);
      }
      this.assisted.delete(key);
    }
    return { assisted, clean, recovered };
  }

  private eligible(item: ReviewItem, hasFresh: boolean, now: number): boolean {
    return now >= item.readyAt && (this.presentations >= item.after || !hasFresh);
  }

  available(pool: readonly Word[], now: number): readonly Word[] {
    const hasFresh = pool.some((word) => !this.pending.has(wordKey(word)));
    return pool.filter((word) => {
      const item = this.pending.get(wordKey(word));
      return !item || this.eligible(item, hasFresh, now);
    });
  }

  next(pool: readonly Word[], active: readonly Word[], now: number): Word | undefined {
    const allowed = new Set(pool.map(wordKey));
    const busy = new Set(active.map(wordKey));
    const hasFresh = pool.some((word) => !this.pending.has(wordKey(word)));
    for (const [key, item] of this.pending) {
      if (allowed.has(key) && !busy.has(key) && this.eligible(item, hasFresh, now)) return item.word;
    }
    return undefined;
  }

  waitMs(pool: readonly Word[], now: number): number {
    const deadline = pool.reduce((soonest, word) => Math.min(soonest,
      this.pending.get(wordKey(word))?.readyAt ?? now), Infinity);
    return Math.max(50, deadline - now);
  }
}
