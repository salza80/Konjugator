import InputManager from './InputManager';
import Block from './Block';
import GameTextFactory from './GameText';
import Bullet from './Bullet';
import Score from './Score';
import LevelText from './LevelText';
import { getRandomInt, shuffle } from '../helpers/util.js'

const NO_STARTING_BLOCKS = 100
const BLOCK_SIZE = 20
const LEVEL_TIME_SECONDS = 60

const LEVEL_ONE_FALLING_TEXT_TIMER_FROM = 6000
const LEVEL_ONE_FALLING_TEXT_TIMER_TO = 15000
const PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE = 0.15

const LEVEL_ONE_BONUS_TEXT_TIMER_FROM = 10000
const LEVEL_ONE_BONUS_TEXT_TIMER_TO = 20000
const PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE = 0.025

const LEVEL_SCORE_MULTIPLIER = 2

export default class GameManager {
  constructor(config) {
    this.scene = config.scene
  	this.x  = config.x
  	this.y = config.y
  	this.width = config.width
  	this.height = config.height

  	this.blockSize = BLOCK_SIZE
  	this.noStartingBlocks = NO_STARTING_BLOCKS
  	this.levelTimeSeconds = LEVEL_TIME_SECONDS
  	this.levelScoreMultiplier = LEVEL_SCORE_MULTIPLIER

	 	this.fallingTextTimerFrom = LEVEL_ONE_FALLING_TEXT_TIMER_FROM
	  this.fallingTextTimerTo = LEVEL_ONE_FALLING_TEXT_TIMER_TO
	  this.bonusTextTimerFrom = LEVEL_ONE_BONUS_TEXT_TIMER_FROM
	  this.bonusTextTimerTo = LEVEL_ONE_BONUS_TEXT_TIMER_TO

	  this.showTouchInput = config.showTouchInput
	  this.sideInputWidth = this.showTouchInput ? config.sideInputWidth : 0
	  this.playWidth = config.width - (this.sideInputWidth * 2)

	  this.gameBoundsXLeft = this.x + this.sideInputWidth
    this.gameBoundsXRight = this.x + this.sideInputWidth + this.playWidth
    this.gameBoundsYTop = this.y
    this.gameBoundsYBottom = this.height - 100

    this.funcOnGameOver = config.onGameOver ? config.onGameOver.bind(config.context) : () => {}

	  this.inputManager = new InputManager({
        scene: this.scene,
        x: 0,
        y: 0,
        height: this.height,
        width: this.width,
        sideWidth: this.sideInputWidth,
        showTouchInput:this.showTouchInput,
        onFire: this.fire,
        context: this
      })

	  this.currentLevel = 1
    
      // Add and play the music
      this.music = this.scene.sound.add('overworld');
      this.music.play({
          loop: true
      });

      this.textTimers = [];
      this.tilesGroup = this.scene.add.group()
      this.gameTextGroup = this.scene.add.group({ runChildUpdate: true })
      this.bullets = this.scene.add.group()
      this.scene.physics.add.overlap(this.gameTextGroup, this.tilesGroup, this.smashBlock, null, this);

      this.scoreText = new Score({
          scene: this.scene,
          x: this.gameBoundsXRight - 150,
          y: this.gameBoundsYTop  + 50,
          text: "",
          opts: { fill: "#00ff00", fontSize: 20 }
      })

      this.levelText = new LevelText({
          scene: this.scene,
          x: this.gameBoundsXLeft + 20,
          y: this.gameBoundsYTop  + 50,
          text: "",
          opts: { fill: "#00ff00", fontSize: 20 }
      })

      this.tilesGroup.addMultiple(this.createStartBlocks(this.noStartingBlocks), this.scene)
  }

  onGameTextRemoved(answerText) {
  	if(this.showTouchInput) {
  		this.inputManager.gameTextRemoved(answerText)
  	}
  }

  onGameTextSelected(answerText) {
  	if(this.showTouchInput) {
 			this.inputManager.setAnswerText(answerText)
	  	this.gameTextGroup.getChildren().forEach((gameText) => gameText.toggleSelected(answerText))
		}
  }

  startLevel() {
    //set random word timer
    this.startText = this.scene.add.text(this.gameBoundsXLeft + 100, 200, this.scene.registry.get('startText'), { fill: "#00ff00", fontSize: 30 })
    if (!this.showTouchInput) {
    	this.keysText = this.scene.add.text(this.gameBoundsXLeft + 100, 300, 'For ä,ö,ü & ß input on english keyboard use the buttons or 1, 2, 3, 4 keys respectively.', { fill: "#00ff00", fontSize: 20 })
    } else {
    	this.keysText = this.scene.add.text(this.gameBoundsXLeft + 100, 300, 'Switch to landscape view', { fill: "#00ff00", fontSize: 20 })
    }
    this.startLevelText = this.scene.add.text(this.gameBoundsXLeft + 100, 250, 'Starting Level ' + this.currentLevel +  ' in ', { fill: "#00ff00", fontSize: 30 })
    this.countDownEvent = this.scene.time.addEvent({delay: 1000, callback: this.startLevelCallback, callbackScope: this, repeat: 1})
  }

  startLevelCallback() {
    if (this.countDownEvent.getRepeatCount() !== 0) {
      this.startLevelText.setText('Starting Level ' + this.currentLevel +  ' in ' + this.countDownEvent.getRepeatCount())
     } else {
      
      this.startLevelText.destroy()
      this.startText.destroy()
      this.keysText.destroy()
      this.inputManager.setText('')
      this.levelText.startLevel(this.currentLevel, LEVEL_TIME_SECONDS, () => this.nextLevel())
      this.spawnFallingText()
      this.setRandomTextTimer(this.spawnBonusText, 15000, 50000)
    }  
  }

  nextLevel() {
  	this.endLevel()
  	this.currentLevel = this.currentLevel + 1
    this.fallingTextTimerFrom = this.fallingTextTimerFrom - (this.fallingTextTimerFrom * PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE)
    this.fallingTextTimerTo = this.fallingTextTimerTo - (this.fallingTextTimerTo * PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE)
    if (this.fallingTextTimerFrom >= this.fallingTextTimerTo) {this.fallingTextTimerTo = this.fallingTextTimerFrom + 500}
    this.bonusTextTimerFrom = this.bonusTextTimerFrom - (this.bonusTextTimerFrom * PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE)
    this.bonusTextTimerTo = this.bonusTextTimerTo - (this.bonusTextTimerTo * PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE)
    if (this.bonusTextTimerFrom >= this.bonusTextTimerTo) {this.bonusTextTimerTo = this.bonusTextTimerFrom + 500}
  	this.startLevel()
  }

  endLevel() {
    this.textTimers.forEach((timer) => timer.remove())
    this.inputManager.setAnswerText('')
    this.gameTextGroup.clear(true,true)
    this.bullets.clear(true,true)    
  }

  setRandomTextTimer(func, fromDelay, toDelay) {
    this.textTimers.push(this.scene.time.addEvent({delay: getRandomInt(fromDelay, toDelay), callback: func, callbackScope: this, loop: false}))
  }

  fire( answerText ) {
    let t = answerText
    if (t === '') { return }

    let hasHit = false

    this.gameTextGroup.getChildren().every((fallingText) => {
      if (fallingText.getAnswer() === t) {
        let b = new Bullet({
              scene: this.scene,
              y: this.gameBoundsYBottom,
              target: fallingText
            })
        this.bullets.add(b, this.scene)
        this.scene.physics.add.overlap(b, fallingText, this.hit, null, this)
        
        hasHit = true
        return false
      }
      return true
    })
    if (!hasHit) {
      this.scene.cameras.main.shake(100, 0.05);
      this.scene.sound.playAudioSprite('sfx', 'smb_bump');
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
    this.music.stop()
    this.endLevel()
    this.funcOnGameOver(this.scoreText.getScore())
  }

  spawnFallingText() {
    let remainingBlocks = null
    if (this.tilesGroup.getLength() < 50) {
      remainingBlocks = this.tilesGroup.getChildren().map((block) => block.x)
    }

    let b = GameTextFactory({
      scene: this.scene,
      textType: "falling",
      opts: { fill: "#de77ae", fontSize: 30 },
      remainingBlocks,
      blockSize: this.blockSize,
			gameBoundsXLeft:this.gameBoundsXLeft,
			gameBoundsXRight: this.gameBoundsXRight,
			gameBoundsYTop: this.gameBoundsYTop,
			gameBoundsYBottom: this.gameBoundsYBottom,
			onGameTextSelected: this.onGameTextSelected,
			onGameTextRemoved: this.onGameTextRemoved,
			context: this
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
      scene: this.scene,
      textType: "bonus",
      opts: { fill: "#ffa500", fontSize: 20 },
      blockSize: this.blockSize,
			gameBoundsXLeft:this.gameBoundsXLeft,
			gameBoundsXRight: this.gameBoundsXRight,
			gameBoundsYTop: this.gameBoundsYTop,
			gameBoundsYBottom: this.gameBoundsYBottom,
			onGameTextSelected: this.onGameTextSelected,
			onGameTextRemoved: this.onGameTextRemoved,
			context: this
    })
    
    this.gameTextGroup.add(b, this)
    this.setRandomTextTimer(
      this.spawnBonusText,
      this.bonusTextTimerFrom,
      this.bonusTextTimerTo
    )
  }

  createStartBlocks(noBlocks) {
    let rows = this.getRows(noBlocks)
    let blocks = [];
    rows.forEach((row) => {
      row.x.forEach((x) => {
        blocks.push(new Block({
          scene: this.scene,
          key: 'block',
          x: x,
          y: row.y,
          blockSize: this.blockSize
        }))
      })
    })
    return blocks;

  }

  getRows(noBlocks) {
    let rows = [];
    let i = 0
    while (i < noBlocks) {
        let randomX = this.getRandomTileX()
        rows.forEach((row, rowIndex) => {
          if(!row.x.includes(randomX)){
            if(randomX){row.x.push(randomX)}
            randomX = undefined
          }
        })
        if (randomX){
          rows.push({y: undefined, x: [randomX]})
        }
        i++
    }
    rows.forEach((row, rowIndex) => {
      let y = ((this.gameBoundsYBottom) - (this.blockSize/2)) - (rowIndex * (this.blockSize + 1))
      row.y = y
    })
   
    return rows
  }

  getRandomTileX () {

    return (getRandomInt(0,(this.playWidth/this.blockSize)-1) * this.blockSize) + (this.blockSize/2) + this.gameBoundsXLeft
  }

}