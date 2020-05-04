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

        this.pressStartMob = new InputButton(this, 300, 200, "START (mobile input)", { fill: "#4ceaee", fontSize: 60 }, this.startGameMobile, this)
        this.add.existing(this.pressStartMob)


        this.pressStart = new InputButton(this, 300, 400, "START (keyboard input)", { fill: "#4ceaee", fontSize: 60 }, this.startGame, this)
        this.add.existing(this.pressStart);
      } else {
        this.pressStart = new InputButton(this, 300, 200, "START GAME", { fill: "#4ceaee", fontSize: 60 }, inputType.toLowerCase() === 'keyboard' ? this.startGame : this.startGameMobile, this)
        this.add.existing(this.pressStart)
      }
    }

    update(time, delta) {
    }

    startGameMobile() {
      this.scene.start('GameScene', {showTouchInput: true})
    }

    startGame() {
      this.scene.start('GameScene', {showTouchInput: false});
    }
}

export default TitleScene;
