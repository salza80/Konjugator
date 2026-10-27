import type Phaser from 'phaser';
import { isPersonalBest, mergeBests, nextChallenge, recordKey, RECORD_VERSION } from '../core/records';
import type { PersonalBest, RecordComparison } from '../core/records';
import type { GameOptions, InputMode, SessionResult, Word } from '../core/types';

export const RECORD_STORAGE_KEY = `konjugator.records.v${RECORD_VERSION}`;
const MAX_RECORDS = 100;
const MAX_STORAGE_LENGTH = 2_000_000;
const books = new WeakMap<Phaser.Game, Map<string, PersonalBest>>();

function storedRecords(): Map<string, PersonalBest> {
  try {
    const raw = window.localStorage.getItem(RECORD_STORAGE_KEY);
    if (!raw || raw.length > MAX_STORAGE_LENGTH) return new Map();
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries)) return new Map();
    const valid = new Map<string, PersonalBest>();
    for (const entry of entries.slice(-MAX_RECORDS)) {
      if (Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string' && isPersonalBest(entry[1])) {
        valid.set(entry[0], entry[1]);
      }
    }
    return valid;
  } catch { return new Map(); }
}

function put(book: Map<string, PersonalBest>, key: string, best: PersonalBest): void {
  book.delete(key);
  book.set(key, best);
  while (book.size > MAX_RECORDS) {
    const oldest = book.keys().next().value;
    if (oldest === undefined) break;
    book.delete(oldest);
  }
}

interface RecordRun {
  options: GameOptions;
  words: readonly Word[];
  mode: InputMode;
  summary: SessionResult;
  eligible?: boolean;
}

/** Memory is per game; browser persistence is opt-in and cannot break gameplay. */
export function recordRun(game: Phaser.Game, { options, words, mode, summary, eligible }: RecordRun): RecordComparison {
  if (eligible === false || summary.practiceTotal) return { newBest: false, target: nextChallenge(summary) };
  const key = recordKey(options, words, mode);
  const book = books.get(game) ?? new Map<string, PersonalBest>();
  books.set(game, book);
  const stored = options.rememberRecords ? storedRecords() : new Map<string, PersonalBest>();
  const memory = book.get(key);
  const saved = stored.get(key);
  const previous = saved ? mergeBests(memory, saved) : memory;
  const attempts = summary.correctAnswers + summary.incorrectAnswers;
  const best = mergeBests(previous, {
    score: summary.score, bestStreak: summary.bestStreak,
    accuracy: attempts ? summary.correctAnswers / attempts : 0,
  });
  put(book, key, best);
  if (options.rememberRecords) {
    put(stored, key, best);
    try {
      const raw = JSON.stringify([...stored]);
      if (raw.length <= MAX_STORAGE_LENGTH) window.localStorage.setItem(RECORD_STORAGE_KEY, raw);
    } catch { /* Keep the session record when storage is unavailable or full. */ }
  }
  return { best, newBest: summary.score > (previous?.score ?? 0), target: nextChallenge(summary, best) };
}
