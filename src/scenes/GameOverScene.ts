import Phaser from 'phaser';
import { COLORS } from '../config';
import type { ResultData } from '../core/types';

export default class GameOverScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() { super('GameOver'); }
  init(result: ResultData): void { this.result = result; }

  create(): void {
    this.add.bitmapText(300, 300, 'font', 'GAME OVER', 30);
    this.add.text(300, 400, `Score: ${this.result.score}`, { color: '#fff', fontSize: 20 });
    this.add.text(300, 470, 'Click or press X to return to the menu', { color: COLORS.button, fontSize: 24 });
    const restart = (): void => {
      this.scene.start('TitleScene', { options: this.result.options, words: this.result.words });
    };
    this.input.keyboard?.once('keydown-X', restart);
    this.input.once('pointerdown', restart);
    this.events.once('shutdown', () => this.input.keyboard?.off('keydown-X', restart));
    this.result.options.onGameOver?.({ score: this.result.score });
  }
}
