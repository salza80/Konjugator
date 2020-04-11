import InputManager from '../sprites/InputManager';
import GameManager from '../sprites/GameManager';

import { getRandomInt } from '../helpers/util.js';

const NO_STARTING_BLOCKS = 100
const LEVEL_TIME_SECONDS = 60

const LEVEL_ONE_FALLING_TEXT_TIMER_FROM = 5000
const LEVEL_ONE_FALLING_TEXT_TIMER_TO = 15000
const PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE = 0.2

const LEVEL_ONE_BONUS_TEXT_TIMER_FROM = 8000
const LEVEL_ONE_BONUS_TEXT_TIMER_TO = 20000
const PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE = 0.05

const LEVEL_SCORE_MULTIPLIER = 2

//game size settings

const PLAY_WIDTH = 1060
const SIDE_INPUT_WIDTH = 110
const BLOCK_SIZE = 20
const FULL_HEIGHT = 700



class GameScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameScene'
        });
    }

    preload() {

    }

    create () {
    this.maximize = this.make.image({
        x: 1250,
        y: 20,
        key: 'maximize',
        add: true
      })
      this.maximize.setDepth(2)
      this.maximize.setDisplaySize(50,50)

      this.maximize.setInteractive().on('pointerdown', () => {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
            // On stop fulll screen
        } else {
            this.scale.startFullscreen();
            // On start fulll screen
        }
    });


      this.gameManager = new GameManager({
        scene: this,
        x: 0,
        y: 0,
        width: 1280,
        height: 700,
        showTouchInput: true,
        sideInputWidth: 110
      })

      
      this.events.on('GameOver', (score) => {
        this.gameOver(score)
      })

      



      
      
      this.gameManager.startLevel()
    }

    gameOver(score) {
      this.registry.set('finalScore', score);
      this.scene.stop('GameScene');
      this.scene.start('GameOver');
    }

    update(time, delta) {

    }  
}

export default GameScene;
