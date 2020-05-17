import InputManager from '../sprites/InputManager';
import GameManager from '../sprites/GameManager';

import { getRandomInt } from '../helpers/util.js';

class GameScene extends Phaser.Scene {
    constructor() {
      super({
        key: 'GameScene'
      }); 
    }

    init(data) {
      this.inputType = data.inputType
    }

    preload() {

    }

    create () {
      this.scale.off('orientationchange')
      this.scale.on('orientationchange', (orientation) => {
        if (orientation === Phaser.Scale.PORTRAIT) {
          if (this.scale.isFullscreen) { this.scale.stopFullscreen() }
        } else if (orientation === Phaser.Scale.LANDSCAPE) {
          if (!this.scale.isFullscreen) { this.scale.startFullscreen() }
        }
      })

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
        inputType: this.inputType,
        sideInputWidth: 110,
        onGameOver: this.gameOver,
        context: this
      })
      
      // if (!this.scale.isFullscreen && this.inputType === 'Touch') { this.scale.startFullscreen() }

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
