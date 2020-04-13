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
        this.pressX = this.add.bitmapText(300, 300, 'font', 'START', 50);
        this.blink = 1000;

       this.pressStart = new InputButton(this, 300, 300, "START", { fill: "#4ceaee", fontSize: 50 }, this.startGame, this)
       

        // this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        // this.pressX.setInteractive()
        // this.pressX.on('pointerdown', () => {
        //     this.startGame();
        // });
    }

    update(time, delta) {
        if (this.registry.get('restartScene')) {
            this.restartScene();
        }
        this.blink -= delta;
        if (this.blink < 0) {
            this.pressX.alpha = this.pressX.alpha === 1 ? 0 : 1;
            this.blink = 500;
        }
        // if (this.startKey.isDown) {
        //     this.startGame();
        // }
    }

    startGame() {
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    }
}

export default TitleScene;
