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
      this.title = this.add.sprite(this.sys.game.config.width / 2, 16 * 5);
      this.scene.bringToTop();

      this.registry.set('restartScene', false);

      this.pressStartMob = new InputButton(this, 300, 200, "START (mobile input)", { fill: "#4ceaee", fontSize: 50 }, this.startGameMobile, this)
      this.add.existing(this.pressStartMob)


      this.pressStart = new InputButton(this, 300, 500, "START (keyboard input)", { fill: "#4ceaee", fontSize: 50 }, this.startGame, this)
      this.add.existing(this.pressStart);
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
