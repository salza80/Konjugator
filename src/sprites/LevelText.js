import Phaser from 'phaser';

export default class LevelText extends Phaser.GameObjects.Text {
  constructor(config) {
    super(config.scene, config.x, config.y, config.text, config.opts)
    config.scene.add.existing(this)
    this.levelRunning = false
  }

  startLevel(level, countdown, callback) {
    this.stopLevel()
    this.level = level
    this.countdown = countdown
    this.levelRunning = true
    this.setText(`Level ${level}: ${countdown}`)
    this.timer = this.scene.time.addEvent({
      delay: 1000,
      repeat: countdown - 1,
      callback: () => {
        this.countdown--
        this.setText(`Level ${this.level}: ${this.countdown}`)
        if (this.countdown === 0) {
          this.stopLevel()
          callback()
        }
      }
    })
  }

  stopLevel() {
    this.timer?.remove()
    this.timer = null
    this.levelRunning = false
    if (this.scene) { this.setText('') }
  }
}
