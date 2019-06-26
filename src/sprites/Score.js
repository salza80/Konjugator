
export default class Score extends Phaser.GameObjects.Text {
    constructor(config) {
        super(config.scene, config.x, config.y, config.text, config.opts);
        config.scene.add.existing(this);

        this.score = 0
        this.resetScore()
   }

    updateScore(gameText) {
        this.score = this.score + gameText.getScore()
        if (gameText.textType === 'bonus') {
          this.flashScore()
        }
        this.setText('Score: ' + this.score) 
    }

    flashScore () {
      this.scene.time.addEvent({ callback: () => {
        if (!this.isTinted) {
          this.setTint(0.5)
        } else { this.clearTint()}
      }, callbackScope: this, repeat: 7, loop: false, delay: 100})
    }

    resetScore() {
        this.score = 0
        this.setText('Score: ' + this.score) 
    }
}


