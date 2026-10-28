import { pacingFor } from './pacing';
import type { InputMode, Word } from './types';

export const DIFFICULTIES = ['relaxed', 'standard', 'challenge'] as const;
export type Difficulty = typeof DIFFICULTIES[number];
const PRESET_FACTOR = { relaxed: 0.8, standard: 1, challenge: 1.15 } as const;
const INPUT_FACTOR = { Keyboard: 1, Touch: 0.8, Voice: 0.7 } as const;

/** Small session-owned adjustments; the spawner applies them at wave boundaries. */
export default class DifficultyController {
  private outcomes: boolean[] = [];
  private adjustment = 1;

  constructor(readonly preset: Difficulty = 'standard', private mode: InputMode = 'Keyboard') {}

  setInputMode(mode: InputMode): void { this.mode = mode; }

  record(correct: boolean): void {
    this.outcomes.push(correct);
    if (this.outcomes.length < 8) return;
    const accuracy = this.outcomes.filter(Boolean).length / this.outcomes.length;
    const step = accuracy >= 0.875 ? 0.05 : accuracy < 0.625 ? -0.05 : 0;
    this.adjustment = Math.max(0.85, Math.min(1.1, Math.round((this.adjustment + step) * 100) / 100));
    this.outcomes = [];
  }

  private get movementFactor(): number { return PRESET_FACTOR[this.preset] * INPUT_FACTOR[this.mode] * this.adjustment; }

  pacing(level: number, elapsed: number, practice = false) {
    const base = pacingFor(practice ? 1 : level, practice ? 0 : elapsed);
    const factor = practice ? 0.8 * INPUT_FACTOR[this.mode] : this.movementFactor;
    return {
      ...base,
      movementFactor: factor,
      interval: Math.max(2, Math.ceil(base.interval / factor)),
      fallingSpeed: base.fallingSpeed * factor,
      maxTargets: practice ? 1 : Math.max(1, base.maxTargets
        - (this.preset === 'relaxed' ? 1 : 0) - (this.mode === 'Keyboard' ? 0 : 1)),
    };
  }

  /** Give longer answers more travel time without changing their score. */
  answerAllowance(word: Word): number {
    const length = [...word.answer].length;
    return Math.max(0.7, 1 - Math.max(0, length - 6) * 0.02);
  }
}
