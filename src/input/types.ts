import type WordTarget from '../entities/WordTarget';

export interface PlayerInput {
  clear(): void;
  pause(): void;
  dispose(): void;
  select?(target: WordTarget): void;
  remove?(target: WordTarget): void;
}
