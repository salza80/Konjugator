import Block from '../sprites/Block';
import GameTextFactory from '../sprites/GameText';
import InputText from '../sprites/InputText';
import MobileInputText from '../sprites/MobileInputText'
import Bullet from '../sprites/Bullet';
import Score from '../sprites/Score';
import LevelText from '../sprites/LevelText';
import { getRandomInt } from '../helpers/util.js';

const NO_STARTING_BLOCKS = 70
const LEVEL_TIME_SECONDS = 300

const LEVEL_ONE_FALLING_TEXT_TIMER_FROM = 5000
const LEVEL_ONE_FALLING_TEXT_TIMER_TO = 15000
const PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE = 0.2

const LEVEL_ONE_BONUS_TEXT_TIMER_FROM = 8000
const LEVEL_ONE_BONUS_TEXT_TIMER_TO = 20000
const PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE = 0.05

const LEVEL_SCORE_MULTIPLIER = 2



class GameScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameScene'
        });
    }

    preload() {

    }

    create () {

      this.scale.on('orientationchange', function(orientation) {
          if (orientation === Phaser.Scale.PORTRAIT) {
            console.log(orientation)
          } else if (orientation === Phaser.Scale.LANDSCAPE) {
            console.log(orientation)
          }
      })

      this.fallingTextTimerFrom = LEVEL_ONE_FALLING_TEXT_TIMER_FROM
      this.fallingTextTimerTo = LEVEL_ONE_FALLING_TEXT_TIMER_TO
      this.bonusTextTimerFrom = LEVEL_ONE_BONUS_TEXT_TIMER_FROM
      this.bonusTextTimerTo = LEVEL_ONE_BONUS_TEXT_TIMER_TO

      this.currentLevel = 1
    
      // Add and play the music
      this.music = this.sound.add('overworld');
      this.music.play({
          loop: true
      });
      this.textTimers = [];
      this.tilesGroup = this.add.group()
      this.gameTextGroup = this.add.group({ runChildUpdate: true })
      this.bullets = this.add.group()
      this.physics.add.overlap(this.gameTextGroup, this.tilesGroup, this.smashBlock, null, this);

      // this.inputText = new InputText({
      //     scene: this,
      //     x: 400,
      //     y: 600,
      //     opts: { fill: "#00ff00", fontSize: 20 }
      // })
      this.inputText = new MobileInputText({
          scene: this,
          x: 0,
          y: 600,
          opts: { fill: "#00ff00", fontSize: 20 }
      })
      this.events.on('GameTextSelected', (gameText) => {
        this.inputText.setAnswerText(gameText)
      })
      this.events.on('GameTextRemoved', (gameText) => {
        this.inputText.gameTextRemoved(gameText)
      })
      this.events.on('correctAnswer', (answerText) => {
        this.fire(answerText)
      })

      this.scoreText = new Score({
          scene: this,
          x: 1000,
          y: 50,
          text: "",
          opts: { fill: "#00ff00", fontSize: 20 }
      })

      this.maximize = this.make.image({
        x: 1250,
        y: 20,
        key: 'maximize',
        add: true
      })
      this.maximize.setDisplaySize(30,30)

      this.maximize.setInteractive().on('pointerdown', () => {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
            // On stop fulll screen
        } else {
            this.scale.startFullscreen();
            // On start fulll screen
        }
    });

      this.levelText = new LevelText({
          scene: this,
          x: 100,
          y: 50,
          text: "",
          opts: { fill: "#00ff00", fontSize: 20 }
      })

      
      this.startLevel()
    }

    startLevel() {
      //set random word timer
      this.startText = this.add.text(30, 200, this.registry.get('startText'), { fill: "#00ff00", fontSize: 30 })
      //this.keysText = this.add.text(100, 300, 'For ä,ö,ü & ß input on english keyboard use the buttons or 1, 2, 3, 4 keys respectively.', { fill: "#00ff00", fontSize: 13 })
      this.startLevelText = this.add.text(50, 250, 'Starting Level ' + this.currentLevel +  ' in ', { fill: "#00ff00", fontSize: 30 })
      this.countDownEvent = this.time.addEvent({delay: 1000, callback: this.startLevelCallback, callbackScope: this, repeat: 5})
    }

    startLevelCallback() {
      if (this.countDownEvent.getRepeatCount() !== 0) {
        this.startLevelText.setText('Starting Level ' + this.currentLevel +  ' in ' + this.countDownEvent.getRepeatCount())
       } else {
        this.tilesGroup.addMultiple(Block.createStartBlocks(NO_STARTING_BLOCKS, this), this)
        this.startLevelText.destroy()
        this.startText.destroy()
        //this.keysText.destroy()
        this.inputText.setText('')
        this.levelText.startLevel(this.currentLevel, LEVEL_TIME_SECONDS, () => this.endLevel())
        this.spawnFallingText()
        this.setRandomTextTimer(this.spawnBonusText, 15000, 50000)
      }  
    }

    endLevel() {
      this.textTimers.forEach((timer) => timer.remove())
      this.tilesGroup.clear(true,true)
      this.gameTextGroup.clear(true,true)
      this.bullets.clear(true,true)
      this.currentLevel = this.currentLevel + 1
      this.fallingTextTimerFrom = this.fallingTextTimerFrom - (this.fallingTextTimerFrom * PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE)
      this.fallingTextTimerTo = this.fallingTextTimerTo - (this.fallingTextTimerTo * PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE)
      if (this.fallingTextTimerFrom >= this.fallingTextTimerTo) {this.fallingTextTimerTo = this.fallingTextTimerFrom + 500}
      this.bonusTextTimerFrom = this.bonusTextTimerFrom - (this.bonusTextTimerFrom * PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE)
      this.bonusTextTimerTo = this.bonusTextTimerTo - (this.bonusTextTimerTo * PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE)
      if (this.bonusTextTimerFrom >= this.bonusTextTimerTo) {this.bonusTextTimerTo = this.bonusTextTimerFrom + 500}

      this.startLevel()
    }

    setRandomTextTimer(func, fromDelay, toDelay) {
      this.textTimers.push(this.time.addEvent({delay: getRandomInt(fromDelay, toDelay), callback: func, callbackScope: this, loop: false}))
    }

    fire( answerText ) {
      let t = answerText
      if (t === '') { return }

      let hasHit = false

      this.gameTextGroup.getChildren().every((fallingText) => {
        if (fallingText.answer === t) {
          let b = new Bullet({
                scene: this,
                y: 600,
                target: fallingText
              })
          this.bullets.add(b, this)
          this.physics.add.overlap(b, fallingText, this.hit, null, this)
          
          hasHit = true
          return false
        }
        return true
      })
      if (!hasHit) {
        this.cameras.main.shake(100, 0.05);
        this.sound.playAudioSprite('sfx', 'smb_bump');
      }
    }

    hit(bullet, fallingText) {
      let score = fallingText.getScore()
      score = score * (LEVEL_SCORE_MULTIPLIER * this.currentLevel)
      this.scoreText.updateScore(score, fallingText.textType === 'bonus')
      bullet.destroy()
      fallingText.hit()
    }

    smashBlock(fallingText, block) {
        block.blowUp()
        fallingText.blowUp()
        if (this.tilesGroup.getLength() === 0 ) {
          
          this.gameOver()
        }
    }

    gameOver() {
      this.registry.set('finalScore', this.scoreText.getScore());
      this.music.stop()
      this.scene.stop('GameScene');
      this.scene.start('GameOver');
    }

    spawnFallingText() {
      let remainingBlocks = null
      if (this.tilesGroup.getLength() < 30) {
        remainingBlocks = this.tilesGroup.getChildren().map((block) => block.x)
      }

      let b = GameTextFactory({
          scene: this,
          textType: "falling",
          opts: { fill: "#de77ae", fontSize: 30 },
          remainingBlocks 
      })
      this.gameTextGroup.add(b, this)

      this.setRandomTextTimer(
        this.spawnFallingText,
        this.fallingTextTimerFrom,
        this.fallingTextTimerTo
      )
    }

    spawnBonusText() {
        let b = GameTextFactory({
            scene: this,
            textType: "bonus",
            opts: { fill: "#ffa500", fontSize: 20 }
        })
        
        this.gameTextGroup.add(b, this)
        this.setRandomTextTimer(
          this.spawnBonusText,
          this.bonusTextTimerFrom,
          this.bonusTextTimerTo
        )
    }


    update(time, delta) {

    }  
}

export default GameScene;
