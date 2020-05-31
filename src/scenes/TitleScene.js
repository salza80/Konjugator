import InputButton from '../sprites/InputButton';

class TitleScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'TitleScene'
        });
    }
    preload() {
        
    }

    create() {
      this.setupOrientationchange();

      this.title = this.add.sprite(this.sys.game.config.width / 2, 16 * 5);
      this.scene.bringToTop();

      this.registry.set('restartScene', false);

      this.inputType = this.registry.get('inputType')

     
      this.add.text(500, 620, 'Version 1.0', { fill: "#00ff00", fontSize: 15 })

      if (!this.inputType){

        this.pressStartMob = new InputButton(this, 200, 100, "START (mobile input)", { fill: "#4ceaee", fontSize: 60 }, this.startGameMobile, this)
        this.add.existing(this.pressStartMob)


        this.pressStart = new InputButton(this, 200, 300, "START (keyboard input)", { fill: "#4ceaee", fontSize: 60 }, this.startGame, this)
        this.add.existing(this.pressStart);

        this.pressStartVoice = new InputButton(this, 200, 500, "START (Voice input)", { fill: "#4ceaee", fontSize: 60 }, this.startGameVoice, this)
        this.add.existing(this.pressStartVoice);
      } else {
        this.pressStart = new InputButton(this, 200, 200, "START GAME", { fill: "#4ceaee", fontSize: 60 }, this.startGamePreset, this)
        this.add.existing(this.pressStart)
      }
      this.checkOrientation();
     
    }

    update(time, delta) {
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
        this.scene.run("OrientationScene", {returnScene: 'TitleScene'})
        this.scene.pause();
      } 
    }

    checkFullScreenSwitch() {
      if (!this.sys.game.device.os.desktop  && !this.scale.isFullscreen) { this.scale.startFullscreen() }
    }

    startGamePreset() {
      this.checkFullScreenSwitch()
      this.scene.start('GameScene', {inputType: this.inputType});
    }

    startGameMobile() {
      this.checkFullScreenSwitch()
      this.scene.start('GameScene', {inputType: 'Touch'})
    }

    startGameVoice() {
      this.checkFullScreenSwitch()
      this.scene.start('GameScene', {inputType: 'Voice'})
    }

    startGame() {
      this.checkFullScreenSwitch()
      this.scene.start('GameScene', {inputType: 'Keyboard'});
    }
}

export default TitleScene;
