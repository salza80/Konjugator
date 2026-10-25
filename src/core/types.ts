export type InputMode = 'Keyboard' | 'Touch' | 'Voice';
export type WordKind = 'falling' | 'bonusfalling' | 'bonus';
export type SessionPhase = 'countdown' | 'playing' | 'over';

export interface Word {
  question: string;
  answer: string;
  tip?: string;
  voice?: string;
}

export interface GameResult {
  score: number;
}

/** Public embedding API; snake_case keys are retained for compatibility. */
export interface GameConfig {
  start_text?: string;
  asset_path?: string;
  input_type?: InputMode | null;
  words?: readonly Word[];
  words_url?: string;
  game_over_callback?: (result: GameResult) => void;
  parent?: string | HTMLElement;
}

export interface GameOptions {
  startText: string;
  assetPath: string;
  inputMode: InputMode | null;
  words: unknown;
  wordsUrl: string | null;
  onGameOver: ((result: GameResult) => void) | null;
}

export interface ReadyData {
  options: GameOptions;
  words: readonly Word[];
}

export interface PlayData extends ReadyData {
  inputMode: InputMode;
}

export interface ResultData extends ReadyData {
  score: number;
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
