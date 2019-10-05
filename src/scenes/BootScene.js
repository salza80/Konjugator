import makeAnimations from '../helpers/animations';

class BootScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'BootScene'
        });
    }
    preload() {
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
            'assets/music/overworld.ogg',
            'assets/music/overworld.mp3'
        ]);

        // Sound effects in a audioSprite.
        this.load.audioSprite('sfx', 'assets/audio/sfx.json', [
            'assets/audio/sfx.ogg',
            'assets/audio/sfx.mp3'
        ], {
            instances: 4
        });

        this.load.bitmapFont('font', 'assets/fonts/font.png', 'assets/fonts/font.fnt');
        this.load.image('block', 'assets/images/purpleBlock.png');
        this.load.image('bullet', 'assets/images/bullet.png');

        // This json containing verb conjuation in present
        var customConfig = this.registry.get('custom_game_data')

        if (customConfig) {
            if (customConfig.words_url) {
                this.load.json('verbs', customConfig.words_url);
            } else if (customConfig.words) {
                this.load.json('verbs', customConfig.words);
            } else {
                this.load.json('verbs', 'assets/data/verbsPresent.json');
            }

            if (customConfig.start_text) {
                this.registry.set('startText', customConfig.start_text)
            } { this.registry.set('startText', 'Konjugiere das verb! Bist du bereit?') }

        } else {
            this.load.json('verbs', 'assets/data/verbsPresent.json'); 
            this.registry.set('startText', 'Konjugiere das verb! Bist du bereit?') 
        }
    }
}

export default BootScene;
