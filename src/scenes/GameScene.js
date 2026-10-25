import InputButton from '../sprites/InputButton';
import { setupOrientation, checkOrientation } from '../helpers/orientation';
import Phaser from 'phaser';
import GameManager from '../sprites/GameManager';

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
      this.setupOrientationchange();
      this.game.canvas.tabIndex = 0
      this.game.canvas.focus({ preventScroll: true })
      this.input.on('pointerdown', () => this.game.canvas.focus({ preventScroll: true }))
     

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
      this.add.existing(new InputButton(this, 20, 10, 'Menu', { fill: '#4ceaee', fontSize: 20 }, () => {
        this.scene.start('TitleScene')
      }, this).setDepth(3))
      this.checkOrientation()
    }

    setupOrientationchange() {
      setupOrientation(this)
    }

    checkOrientation() {
      checkOrientation(this)
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
