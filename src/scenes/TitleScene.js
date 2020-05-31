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
      this.scale.off('orientationchange')
      this.scale.on('orientationchange', (orientation) => {
        if (orientation === Phaser.Scale.PORTRAIT) {
         if (this.scale.isFullscreen) {
            this.scale.stopFullscreen()
          }
          if (!this.sys.game.device.os.desktop) {
            this.loadOrientationWarning()
          }
        } else if (orientation === Phaser.Scale.LANDSCAPE) {
           if (!this.sys.game.device.os.desktop) {
            this.loadStartButtons()
          }
          if (!this.scale.isFullscreen) { this.scale.startFullscreen() }
        }
      })

      this.title = this.add.sprite(this.sys.game.config.width / 2, 16 * 5);
      this.scene.bringToTop();

      this.registry.set('restartScene', false);

      this.inputType = this.registry.get('inputType')

      console.log(this.sys.game.device.os.desktop)
      console.log(this.scale.orientation)
      if (!this.sys.game.device.os.desktop && this.scale.orientation === Phaser.Scale.PORTRAIT) {
        this.loadOrientationWarning()
      } else
      {
        this.loadStartButtons()
      }
      this.add.text(500, 620, 'Version 1.0', { fill: "#00ff00", fontSize: 15 })
    }

    loadOrientationWarning() {
      this.destroyOrientationWarning()
      this.destroyStartButtons()
      this.OrientationWarningText = this.add.text(100, 100, 'Switch your device to Landscape', { fill: "#F0091F", fontSize: 60 })
      this.OrientationWarningText2 = this.add.text(100, 300, 'If the screen does not rotate:', { fill: "#00ff00", fontSize: 40 })
      this.OrientationWarningText3 = this.add.text(100, 400, 'check Auto-rotate screen option is on (Android)', { fill: "#00ff00", fontSize: 40 })
      this.OrientationWarningText4 = this.add.text(100, 500, 'Or Orientation Lock is off on Iphone', { fill: "#00ff00", fontSize: 40 })
    }

    destroyOrientationWarning() {
      if (this.OrientationWarningText) {this.OrientationWarningText.destroy()}
      if (this.OrientationWarningText2) {this.OrientationWarningText2.destroy()}
      if (this.OrientationWarningText3) {this.OrientationWarningText3.destroy()}
      if (this.OrientationWarningText4) {this.OrientationWarningText4.destroy()}

    }

    destroyStartButtons() {
      if (this.pressStartMob) {this.pressStartMob.destroy()}
      if (this.pressStart) {this.pressStart.destroy()}
      if (this.pressStartVoice) {this.pressStartVoice.destroy()}
    }

    loadStartButtons() {
      this.destroyStartButtons()
      this.destroyOrientationWarning()
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

    }

    update(time, delta) {
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
