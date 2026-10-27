import type { GameConfig, GameOptions, InputMode, Playfield } from './core/types';
import { SESSION_PRESETS } from './core/sessionPresets';
import { DIFFICULTIES } from './core/DifficultyController';

export const GAME = {
  width: 1280,
  height: 700,
  bottomSpace: 100,
  hudHeight: 140,
  touchSideWidth: 192,
  blockSize: 20,
  levelSeconds: 90,
  levelSpawnGraceSeconds: 10,
  initialCountdownSeconds: 5,
  levelCountdownSeconds: 2,
  answerDisplayMs: 1500,
  correctionDisplayMs: 3200,
  feedbackDisplayMs: 2200,
  shotDisplayMs: 240,
  horizontalWordSpeed: 70,
  startText: 'Konjugiere das verb! Bist du bereit?',
} as const;

export const COLORS = {
  text: '#00ff00',
  button: '#4ceaee',
  answer: '#ffff00',
  selected: '#070a91',
  error: '#ff8888',
  success: '#8ff0a4',
} as const;

export function normalizeConfig(config: GameConfig): GameOptions {
  const modes: readonly unknown[] = ['Keyboard', 'Touch', 'Voice'];
  const sessionPreset = config.session_preset === 'quick' ? 'quick' : 'survival';
  const preset = SESSION_PRESETS[sessionPreset];
  return {
    startText: typeof config.start_text === 'string' && config.start_text ? config.start_text : GAME.startText,
    assetPath: typeof config.asset_path === 'string' && config.asset_path ? config.asset_path : 'assets/',
    inputMode: modes.includes(config.input_type) ? config.input_type ?? null : null,
    words: config.words,
    wordsUrl: typeof config.words_url === 'string' && config.words_url ? config.words_url : null,
    roundGoal: Number.isSafeInteger(config.round_goal) && (config.round_goal ?? 0) > 0 ? config.round_goal ?? preset.roundGoal : preset.roundGoal,
    sessionPreset,
    startingHealth: preset.health,
    difficulty: DIFFICULTIES.includes(config.difficulty ?? 'standard') ? config.difficulty ?? 'standard' : 'standard',
    onGameOver: typeof config.game_over_callback === 'function' ? config.game_over_callback : null,
  };
}

export function createPlayfield(mode: InputMode): Playfield {
  const sideWidth = mode === 'Touch' ? GAME.touchSideWidth : 0;
  return {
    left: sideWidth,
    right: GAME.width - sideWidth,
    top: GAME.hudHeight,
    bottom: GAME.height - GAME.bottomSpace,
    width: GAME.width - sideWidth * 2,
    height: GAME.height,
    sideWidth,
  };
}
