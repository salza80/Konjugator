import makeAnimations from '../helpers/animations';

class BootScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'BootScene'
        });
    }
    preload() {
         // This json containing verb conjuation in present
        var customConfig = this.registry.get('custom_game_data')

        if (customConfig && customConfig.asset_path) {
            this.load.path = customConfig.asset_path
        } else {
            this.load.path ="assets/"
        }


        const progress = this.add.graphics();

        // Register a load progress event to show a load bar
        this.load.on('progress', (value) => {
            progress.clear();
            progress.fillStyle(0xffffff, 1);
            progress.fillRect(0, this.sys.game.config.height / 2, this.sys.game.config.width * value, 60);
        });

        // Register a load complete event to launch the title screen when all files are loaded
        this.load.on('complete', () => {
            // prepare all animations, defined in a separate file
            makeAnimations(this);
            progress.destroy();
            this.scene.start('TitleScene');
        });

        // Music to play. It's not properly edited for an continous loop, but game play experience isn't really the aim of this repository either.
        this.load.audio('overworld', [
            'music/overworld.ogg',
            'music/overworld.mp3'
        ]);

        // Sound effects in a audioSprite.
        this.load.audioSprite('sfx', 'audio/sfx.json', [
            'audio/sfx.ogg',
            'audio/sfx.mp3'
        ], {
            instances: 4
        });

        this.load.bitmapFont('font', 'fonts/font.png', 'fonts/font.fnt');
        this.load.image('block', 'images/purpleBlock.png');
        this.load.image('bullet', 'images/bullet.png');
        this.load.image('maximize', 'images/maximize.png');

        if (customConfig) {
            if (customConfig.words_url) {z
                this.load.json('words', customConfig.words_url);
            } else {
                this.load.json('words', 'data/verbsPresent.json');
            }

            if (customConfig.start_text) {
                this.registry.set('startText', customConfig.start_text)
            } { this.registry.set('startText', 'Konjugiere das verb! Bist du bereit?') }

        } else {
            this.load.json('words', 'data/verbsPresent.json'); 
            this.registry.set('startText', 'Konjugiere das verb! Bist du bereit?') 
        }
    }

    create() {
        this.scale.on('orientationchange', (orientation) => {
          if (orientation === Phaser.Scale.PORTRAIT) {
            if (this.scale.isFullscreen) { this.scale.stopFullscreen() }
          } else if (orientation === Phaser.Scale.LANDSCAPE) {
            if (!this.scale.isFullscreen) { this.scale.startFullscreen() }
          }
        })
    }
}
export default BootScene;
