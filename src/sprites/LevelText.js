
export default class LevelText extends Phaser.GameObjects.Text {
  constructor(config) {
    super(config.scene, config.x, config.y, config.text, config.opts);
    config.scene.add.existing(this);
    this.level = 1
    this.levelRunning =  false
   }

  startLevel(level, countdown, callback){
    this.level = level
    this.countdown = countdown
    this.setText('Level ' + this.level + ': ' + this.countdown)
    this.levelRunning = true
    this.scene.time.addEvent({ callback: () => {
      if (this.countdown === 0) {
        this.levelRunning=false
        this.setText('')
        callback()
      } else {
      this.countdown = this.countdown - 1
      this.setText('Level ' + this.level + ': ' + this.countdown) 
    }
    }, callbackScope: this, repeat: countdown, loop: false, delay: 1000})
  }
}


