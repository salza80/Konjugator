import type { GameConfig, GameOptions, InputMode, Playfield } from './core/types';

export const GAME = {
  width: 1280,
  height: 700,
  bottomSpace: 100,
  touchSideWidth: 110,
  blockSize: 20,
  startingBlocks: 60,
  levelSeconds: 90,
  countdownSeconds: 5,
  answerDisplayMs: 1500,
  bulletSpeed: 200,
  homingBulletSpeed: 500,
  horizontalWordSpeed: 70,
  startText: 'Konjugiere das verb! Bist du bereit?',
} as const;

export const COLORS = {
  text: '#00ff00',
  button: '#4ceaee',
  answer: '#ffff00',
  selected: '#070a91',
  error: '#ff8888',
} as const;

export function normalizeConfig(config: GameConfig): GameOptions {
  const modes: readonly unknown[] = ['Keyboard', 'Touch', 'Voice'];
  return {
    startText: typeof config.start_text === 'string' && config.start_text ? config.start_text : GAME.startText,
    assetPath: typeof config.asset_path === 'string' && config.asset_path ? config.asset_path : 'assets/',
    inputMode: modes.includes(config.input_type) ? config.input_type ?? null : null,
    words: config.words,
    wordsUrl: typeof config.words_url === 'string' && config.words_url ? config.words_url : null,
    onGameOver: typeof config.game_over_callback === 'function' ? config.game_over_callback : null,
  };
}

export function createPlayfield(mode: InputMode): Playfield {
  const sideWidth = mode === 'Touch' ? GAME.touchSideWidth : 0;
  return {
    left: sideWidth,
    right: GAME.width - sideWidth,
    top: 0,
    bottom: GAME.height - GAME.bottomSpace,
    width: GAME.width - sideWidth * 2,
    height: GAME.height,
    sideWidth,
  };
}
