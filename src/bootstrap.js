import { startGame } from './main.js';

let customConfig;
try {
  customConfig = window.parent.gameConfig;
} catch {
  // A cross-origin iframe cannot read its parent's configuration.
}

startGame(customConfig || {
  start_text: 'Konjugiere das verb! Bist du bereit?',
  asset_path: `${import.meta.env.BASE_URL}assets/`,
  input_type: null
});
