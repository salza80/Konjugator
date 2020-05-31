import InputManager from '../sprites/InputManager';
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

    setupOrientationchange() {
      this.scale.off('orientationchange')
      this.scale.on('orientationchange', (orientation) => {
        if (orientation === Phaser.Scale.PORTRAIT) {
         if (this.scale.isFullscreen) {
            this.scale.stopFullscreen()
          }
          if (!this.sys.game.device.os.desktop) {
            this.checkOrientation();
          }
        } else if (orientation === Phaser.Scale.LANDSCAPE) {
          if (!this.scale.isFullscreen) { this.scale.startFullscreen() }
        }
      })
    }

    checkOrientation() {
      if (!this.sys.game.device.os.desktop && this.scale.orientation === Phaser.Scale.PORTRAIT) {
        var os = this.scene.get("OrientationScene");
        os.setupOrientationChange()
        this.scene.run("OrientationScene", {returnScene: 'GameScene'})
        this.scene.pause();
      } 
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
