
/*
Generic enemy class that extends Phaser sprites.
Classes for enemy types extend this class.
*/

export default class Score extends Phaser.GameObjects.Text {
    constructor(config) {
        super(config.scene, config.x, config.y, config.text, config.opts);
        config.scene.add.existing(this);
        this.score = 0
        this.resetScore()

   }

    updateScore(addAmount) {
        this.score = this.score + addAmount
        this.updateText()
        this.setText('Score: ' + this.score) 
    }

    // updateText() {
    //     this.setText('Score: ' + this.score) 
    // }

    resetScore() {
        this.score = 0
        this.setText('Score: ' + this.score) 

    }
}


