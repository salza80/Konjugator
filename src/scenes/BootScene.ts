import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import type { GameOptions, ReadyData } from '../core/types';
import { parseWords } from '../core/words';
import InputButton from '../ui/InputButton';

export default class BootScene extends Phaser.Scene {
  private options!: GameOptions;
  private progress!: Phaser.GameObjects.Graphics;
  private loadErrors: string[] = [];

  constructor() { super('BootScene'); }

  preload(): void {
    // Only the application entry point writes this immutable configuration.
    this.options = this.registry.get('options') as GameOptions;
    this.loadErrors = [];
    this.load.setPath(this.options.assetPath);
    this.progress = this.add.graphics();
    const onProgress = (value: number): void => {
      this.progress.clear().fillStyle(0xffffff).fillRect(0, GAME.height / 2, GAME.width * value, 60);
    };
    const onError = (file: Phaser.Loader.File): void => { this.loadErrors.push(file.key); };
    this.load.on('progress', onProgress);
    this.load.on('loaderror', onError);
    this.events.once('shutdown', () => {
      this.load.off('progress', onProgress);
      this.load.off('loaderror', onError);
    });
    this.load.audioSprite('sfx', 'audio/sfx.json', ['audio/sfx.ogg', 'audio/sfx.mp3']);
    this.load.bitmapFont('font', 'fonts/font.png', 'fonts/font.fnt');
    this.load.image('block', 'images/purpleBlock.png');
    this.load.image('bullet', 'images/bullet.png');
    this.load.image('maximize', 'images/maximize.png');
    this.cache.json.remove('words');
    try {
      if (this.options.wordsUrl) {
        this.load.json('words', new URL(this.options.wordsUrl, window.location.href).href);
      } else if (this.options.words !== undefined) {
        this.cache.json.add('words', this.options.words);
      } else {
        this.load.json('words', 'data/verbsPresent.json');
      }
    } catch {
      this.loadErrors.push('invalid word URL');
    }
  }

  create(): void {
    this.progress.destroy();
    if (this.loadErrors.length) {
      this.showError(`Could not load game files: ${this.loadErrors.join(', ')}. Check the asset and word URLs.`);
      return;
    }
    try {
      const ready: ReadyData = { options: this.options, words: parseWords(this.cache.json.get('words')) };
      this.cache.json.remove('words');
      this.scene.start('TitleScene', ready);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Unable to read word data.');
    }
  }

  private showError(message: string): void {
    this.add.text(100, 150, 'Unable to start the game', { color: COLORS.error, fontSize: 36 });
    this.add.text(100, 240, message, { color: '#fff', fontSize: 24, wordWrap: { width: GAME.width - 200 } });
    new InputButton(this, 100, 420, 'Retry', () => this.scene.restart(), 36);
  }
}
