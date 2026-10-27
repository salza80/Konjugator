import Phaser from 'phaser';
import { GAME, normalizeConfig } from './config';
import type { GameConfig } from './core/types';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';
import OrientationScene from './scenes/OrientationScene';
import PauseScene from './scenes/PauseScene';

export type { GameConfig, GameResult, InputMode, Word } from './core/types';
export type { SessionPreset } from './core/sessionPresets';

export function startGame(customConfig: GameConfig = {}): Phaser.Game {
  const options = normalizeConfig(customConfig);
  return new Phaser.Game({
    type: Phaser.WEBGL,
    pixelArt: true,
    roundPixels: true,
    parent: customConfig.parent ?? 'content',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME.width,
      height: GAME.height,
      autoRound: true,
    },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 300 }, debug: false } },
    scene: [BootScene, TitleScene, GameScene, GameOverScene, OrientationScene, PauseScene],
    callbacks: { preBoot(game) { game.registry.set('options', options); } },
  });
}
