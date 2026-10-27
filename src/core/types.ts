import type { SessionPreset } from './sessionPresets';
import type { Difficulty } from './DifficultyController';

export type InputMode = 'Keyboard' | 'Touch' | 'Voice';
export type WordKind = 'falling' | 'bonusfalling' | 'bonus';
export type SessionPhase = 'countdown' | 'playing' | 'over';

export interface Word {
  /** Short prompt, at most 40 normalized Unicode characters including spaces. */
  question: string;
  /** Word or short phrase, at most 24 normalized Unicode characters including spaces. */
  answer: string;
  tip?: string;
  voice?: string;
}

export type SessionMode =
  | { kind: 'survival' }
  | { kind: 'goal'; target: number }
  | { kind: 'practice'; words: readonly Word[] };

export interface GameResult {
  score: number;
}

/** Internal per-game summary; the embedding callback keeps its existing shape. */
export interface SessionResult extends GameResult {
  correctAnswers: number;
  incorrectAnswers: number;
  missedWords: number;
  bestStreak: number;
  mistakes: readonly Word[];
  practiceTotal: number;
  practiceCompleted: number;
  roundGoal: number;
  roundCompleted: boolean;
}

/** Public embedding API; snake_case keys are retained for compatibility. */
export interface GameConfig {
  start_text?: string;
  asset_path?: string;
  input_type?: InputMode | null;
  words?: readonly Word[];
  words_url?: string;
  /** Quick uses a 15-answer goal and 12 health; omission retains survival. */
  session_preset?: SessionPreset;
  difficulty?: Difficulty;
  /** Correct submitted answers needed to win; overrides the preset goal. */
  round_goal?: number;
  game_over_callback?: (result: GameResult) => void;
  parent?: string | HTMLElement;
}

export interface GameOptions {
  startText: string;
  assetPath: string;
  inputMode: InputMode | null;
  words: unknown;
  wordsUrl: string | null;
  roundGoal: number;
  sessionPreset: SessionPreset;
  startingHealth: number;
  difficulty: Difficulty;
  onGameOver: ((result: GameResult) => void) | null;
}

export interface ReadyData {
  options: GameOptions;
  words: readonly Word[];
}

export interface PlayData extends ReadyData {
  inputMode: InputMode;
  practiceWords?: readonly Word[];
}

export interface ResultData extends PlayData {
  summary: SessionResult;
  lastCorrection?: Word;
}

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Playfield extends Bounds {
  width: number;
  height: number;
  sideWidth: number;
}

export type SubmitAnswer = (answer: string, reportMiss?: boolean) => boolean;
