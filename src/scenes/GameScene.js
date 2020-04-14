import InputManager from '../sprites/InputManager';
import GameManager from '../sprites/GameManager';

import { getRandomInt } from '../helpers/util.js';

class GameScene extends Phaser.Scene {
    constructor(showTouchInput = false) {
        super({
            key: 'GameScene'
        }); 
    }

    init(data) {
      this.showTouchInput = data.showTouchInput
    }

    preload() {

    }

    create () {
      this.maximize = this.make.image({
        x: 1250,
        y: 25,
        key: 'maximize',
        add: true
      })
      this.maximize.setDepth(2)
      this.maximize.setDisplaySize(50,50)

      this.maximize.setInteractive().on('pointerdown', () => {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }
      });
      this.gameManager = new GameManager({
        scene: this,
        x: 0,
        y: 0,
        width: 1280,
        height: 700,
        showTouchInput: this.showTouchInput,
        sideInputWidth: 110,
        onGameOver: this.gameOver,
        context: this
      })
      
      if (!this.scale.isFullscreen) { this.scale.startFullscreen() }

      this.gameManager.startLevel()
    }

    gameOver(score) {
      this.registry.set('finalScore', score);
      this.scene.stop('GameScene');
      this.scene.start('GameOver');
    }

    update(time, delta) {

    }  
}

export default GameScene;
