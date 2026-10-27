import { startGame } from './main';
import type { GameConfig } from './core/types';

// The same-origin iframe API remains separate from the reusable game module.
declare global {
  interface Window { gameConfig?: GameConfig }
}

let config: GameConfig | undefined;
try {
  const candidate = window.parent.gameConfig;
  if (candidate && typeof candidate === 'object') config = candidate;
} catch {
  // Cross-origin parents cannot supply configuration through window properties.
}
startGame(config ?? { asset_path: `${import.meta.env.BASE_URL}assets/`, session_preset: 'quick' });
