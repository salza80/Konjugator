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

        let sh = window.screen.availHeight;
        let sw = window.screen.availWidth;

        // console.log(sh)
        // console.log(sw)

        // let ch = 0;
        // let cw = 0;
        // let multiplier = 1;
        // if (sh / sw > 0.6) {
        //     // Portrait, fit width
        //     multiplier = sw / 400;
        // } else {
        //     multiplier = sh / 240;
        // }
        // multiplier = Math.floor(multiplier);
        // let el = document.getElementsByTagName('canvas')[0];
        // el.style.width = 400 * multiplier + 'px';
        // el.style.height = 240 * multiplier + 'px';

        this.pressX = this.add.bitmapText(500, 300, 'font', 'PRESS X TO START', 15);
        this.blink = 1000;

        this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        this.input.on('pointerdown', () => {
            this.startGame();
        });
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
        if (this.startKey.isDown) {
            this.startGame();
        }
    }

    startGame() {
        if (!this.registry.get('restartScene')) {
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
        } else {
            this.restartScene();
        }
    }

    restartScene() {
        //        this.attractMode.stop();
        this.scene.stop('GameScene');
        this.scene.launch('GameScene');
        this.scene.bringToTop();

        this.registry.set('restartScene', false);
    }
}

export default TitleScene;
