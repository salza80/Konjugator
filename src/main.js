import 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import TitleScene from './scenes/TitleScene';
import GameOverScene from './scenes/GameOverScene';
// import UIPlugin from '../assets/plugins/rexuiplugin.min';

const WIDTH = 1280
const HEIGHT = 700
const config = {
    // For more settings see <https://github.com/photonstorm/phaser/blob/master/src/boot/Config.js>
    type: Phaser.WEBGL,
    pixelArt: true,
    roundPixels: true,
    parent: 'content',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: WIDTH,
        height: HEIGHT,
        orientation: Phaser.Scale.Orientation.LANDSCAPE
    },
    autoRound: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300
            },
            debug: false
        }
    },
    scene: [
        BootScene,
        TitleScene,
        GameScene,
        GameOverScene
    ]
    // plugins: {
    //     scene: [{
    //         key: 'rexUI',
    //         plugin: UIPlugin,
    //         mapping: 'rexUI'
    //     }]
    // }
};

export const startGame = (customGameData) => {
    config.callbacks = {
        preBoot: function (game) {
            game.registry.set('custom_game_data', customGameData)
        }
    }
    const game = new Phaser.Game(config); // eslint-disable-line no-unused-vars
}
