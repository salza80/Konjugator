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
          if (this.scale.isFullscreen) { this.scale.stopFullscreen() }
        } else if (orientation === Phaser.Scale.LANDSCAPE) {
          if (!this.scale.isFullscreen) { this.scale.startFullscreen() }
        }
      })



      this.title = this.add.sprite(this.sys.game.config.width / 2, 16 * 5);
      this.scene.bringToTop();

      this.registry.set('restartScene', false);

      let inputType = this.registry.get('inputType')

      if (!inputType){

        this.pressStartMob = new InputButton(this, 300, 100, "START (mobile input)", { fill: "#4ceaee", fontSize: 60 }, this.startGameMobile, this)
        this.add.existing(this.pressStartMob)


        this.pressStart = new InputButton(this, 300, 300, "START (keyboard input)", { fill: "#4ceaee", fontSize: 60 }, this.startGame, this)
        this.add.existing(this.pressStart);

        this.pressStartVoice = new InputButton(this, 300, 500, "START (Voice input)", { fill: "#4ceaee", fontSize: 60 }, this.startGameVoice, this)
        this.add.existing(this.pressStartVoice);
      } else {
        this.pressStart = new InputButton(this, 300, 200, "START GAME", { fill: "#4ceaee", fontSize: 60 }, this.startGamePreset, this)
        this.add.existing(this.pressStart)
      }
    }

    update(time, delta) {
    }

    startGamePreset() {
      let inputType = this.registry.get('inputType')
      this.scene.start('GameScene', {inputType: inputType});
    }

    startGameMobile() {
      this.scene.start('GameScene', {inputType: 'Touch'})
    }

    startGameVoice() {
      this.scene.start('GameScene', {inputType: 'Voice'})
    }

    startGame() {
      this.scene.start('GameScene', {inputType: 'Keyboard'});
    }
}

export default TitleScene;
