import type { GameOptions, InputMode, SessionResult, Word } from './types';
import { wordKey } from './words';
import { SCORING } from './rules';

export interface PersonalBest { score: number; bestStreak: number; accuracy: number }
export interface RecordComparison { best?: PersonalBest; newBest: boolean; target: string }
export const RECORD_VERSION = 1;

/** Exact identity, independent of supplied order, URLs and non-scoring metadata. */
export function recordKey(options: GameOptions, words: readonly Word[], mode: InputMode): string {
  return JSON.stringify([RECORD_VERSION, mode, options.difficulty, options.sessionPreset,
    options.roundGoal, options.startingHealth, [...new Set(words.map(wordKey))].sort()]);
}

export function isPersonalBest(value: unknown): value is PersonalBest {
  if (!value || typeof value !== 'object') return false;
  const best = value as Record<string, unknown>;
  return typeof best.score === 'number' && Number.isSafeInteger(best.score) && best.score >= 0
    && typeof best.bestStreak === 'number' && Number.isSafeInteger(best.bestStreak) && best.bestStreak >= 0
    && best.bestStreak <= best.score / SCORING.basePoints
    && typeof best.accuracy === 'number' && Number.isFinite(best.accuracy) && best.accuracy >= 0 && best.accuracy <= 1;
}

export function mergeBests(a: PersonalBest | undefined, b: PersonalBest): PersonalBest {
  return {
    score: Math.max(a?.score ?? 0, b.score),
    bestStreak: Math.max(a?.bestStreak ?? 0, b.bestStreak),
    accuracy: Math.max(a?.accuracy ?? 0, b.accuracy),
  };
}

export function nextChallenge(summary: SessionResult, best?: PersonalBest): string {
  if (summary.mistakes.length) return `Next: recall your ${summary.mistakes.length} review ${summary.mistakes.length === 1 ? 'word' : 'words'}.`;
  if (summary.practiceTotal) return 'Set recalled. Play the full game next.';
  if (summary.roundGoal && !summary.roundCompleted) return `Next: finish ${summary.roundGoal} correct answers.`;
  const streak = best?.bestStreak ?? summary.bestStreak;
  if (!summary.roundGoal || streak < summary.roundGoal) return `Next: reach a streak of ${streak + 1}.`;
  const attempts = summary.correctAnswers + summary.incorrectAnswers;
  const accuracy = attempts ? summary.correctAnswers / attempts : 0;
  if ((best?.accuracy ?? accuracy) < 1) return 'Next: finish with 100% answer accuracy.';
  return 'Next: repeat a clean round without corrections.';
}
