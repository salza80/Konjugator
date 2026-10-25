import Phaser from 'phaser';
import InputButton from '../sprites/InputButton';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const config = this.registry.get('custom_game_data') || {}
    this.loadErrors = []
    this.load.setPath(config.asset_path || 'assets/')
    this.registry.set('startText', config.start_text || 'Konjugiere das verb! Bist du bereit?')
    this.registry.set('inputType', ['Keyboard', 'Touch', 'Voice'].includes(config.input_type) ? config.input_type : null)
    this.registry.set('gameOverCallback', typeof config.game_over_callback === 'function' ? config.game_over_callback : null)

    this.progress = this.add.graphics()
    const onProgress = (value) => {
      this.progress.clear()
      this.progress.fillStyle(0xffffff, 1)
      this.progress.fillRect(0, 350, 1280 * value, 60)
    }
    const onError = (file) => this.loadErrors.push(file.key)
    this.load.on('progress', onProgress)
    this.load.on('loaderror', onError)
    this.events.once('shutdown', () => {
      this.load.off('progress', onProgress)
      this.load.off('loaderror', onError)
    })

    this.load.audioSprite('sfx', 'audio/sfx.json', ['audio/sfx.ogg', 'audio/sfx.mp3'])
    this.load.bitmapFont('font', 'fonts/font.png', 'fonts/font.fnt')
    this.load.image('block', 'images/purpleBlock.png')
    this.load.image('bullet', 'images/bullet.png')
    this.load.image('maximize', 'images/maximize.png')

    this.cache.json.remove('words')
    if (config.words_url) {
      // Word URLs are relative to the document, independently of the asset path.
      this.load.json('words', new URL(config.words_url, window.location.href).href)
    } else if (config.words !== undefined) {
      this.cache.json.add('words', config.words)
    } else {
      this.load.json('words', 'data/verbsPresent.json')
    }
  }

  create() {
    this.progress.destroy()
    const words = this.cache.json.get('words')
    if (this.loadErrors.length) {
      this.showError(`Could not load game files: ${this.loadErrors.join(', ')}. Check the asset and word URLs.`)
      return
    }
    if (!Array.isArray(words) || words.length === 0 || words.some((word) =>
      !word || typeof word.question !== 'string' || !word.question.trim() ||
      typeof word.answer !== 'string' || !word.answer.trim() ||
      (word.tip !== undefined && typeof word.tip !== 'string') ||
      (word.voice !== undefined && typeof word.voice !== 'string'))) {
      this.showError('Word data must be a non-empty array with question and answer strings. Tip and voice are optional strings.')
      return
    }
    this.cache.json.remove('words')
    this.cache.json.add('words', words.map((word) => ({
      ...word,
      question: word.question.trim().normalize('NFC'),
      answer: word.answer.trim().replace(/\s+/g, ' ').normalize('NFC')
    })))
    this.scene.start('TitleScene')
  }

  showError(message) {
    this.add.text(100, 150, 'Unable to start the game', { fill: '#ff8888', fontSize: 36 })
    this.add.text(100, 240, message, { fill: '#fff', fontSize: 24, wordWrap: { width: 1080 } })
    this.add.existing(new InputButton(this, 100, 420, 'Retry', { fill: '#4ceaee', fontSize: 36 }, () => {
      this.scene.restart()
    }, this))
  }
}
