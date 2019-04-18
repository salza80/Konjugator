
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

    updateScore(fallingText) {
        switch (fallingText.textType) {
            case 'falling':
                this.score = this.score + fallingText.text.length
                break;
            case 'bonus': 
                this.score = this.score + (fallingText.text.length * (Math.round(fallingText.y / 100)))
                break;
            default:
                break;
        }
        this.setText('Score: ' + this.score) 
    }


    resetScore() {
        this.score = 0
        this.setText('Score: ' + this.score) 

    }
}


