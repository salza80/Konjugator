import Phaser from 'phaser';
import InputManager from './InputManager';
import Block from './Block';
import GameTextFactory from './GameText';
import Bullet from './Bullet';
import Score from './Score';
import LevelText from './LevelText';

const NO_STARTING_BLOCKS = 60
const BLOCK_SIZE = 20
const LEVEL_TIME_SECONDS = 90

const START_FALLING_SPEED = 12
const START_BONUS_FALLING_SPEED = 38
const INCREASE_FALLING_SPEED_PER_LEVEL = 2

const LEVEL_ONE_FALLING_TEXT_TIMER_FROM = 6000
const LEVEL_ONE_FALLING_TEXT_TIMER_TO = 18000
const PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE = 0.10

const LEVEL_ONE_BONUS_TEXT_TIMER_FROM = 10000
const LEVEL_ONE_BONUS_TEXT_TIMER_TO = 20000
const PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE = 0.05

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

	 	this.fallingTextTimerFrom = LEVEL_ONE_FALLING_TEXT_TIMER_FROM
	  this.fallingTextTimerTo = LEVEL_ONE_FALLING_TEXT_TIMER_TO
	  this.bonusTextTimerFrom = LEVEL_ONE_BONUS_TEXT_TIMER_FROM
	  this.bonusTextTimerTo = LEVEL_ONE_BONUS_TEXT_TIMER_TO
	  this.fallingSpeed = START_FALLING_SPEED
	  this.bonusFallingSpeed = START_BONUS_FALLING_SPEED

	  this.inputType = config.inputType
	  this.sideInputWidth = this.inputType === 'Touch' ? config.sideInputWidth : 0
	  this.playWidth = config.width - (this.sideInputWidth * 2)

	  this.gameBoundsXLeft = this.x + this.sideInputWidth
    this.gameBoundsXRight = this.x + this.sideInputWidth + this.playWidth
    this.gameBoundsYTop = this.y
    this.gameBoundsYBottom = this.height - 100

    this.funcOnGameOver = config.onGameOver ? config.onGameOver.bind(config.context) : () => {}

    // setup speek synthesis (if available in browser)
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      this.synth = window.speechSynthesis
      this.utterence = new window.SpeechSynthesisUtterance()
      this.utterence.lang = 'de-DE'
      this.utterence.onerror = () => {console.log("error")}
    }

    

	  this.inputManager = new InputManager({
        scene: this.scene,
        x: 0,
        y: 0,
        height: this.height,
        width: this.width,
        sideWidth: this.sideInputWidth,
        inputType:this.inputType,
        onFire: this.fire,
        context: this
      })

	  this.inputType = this.inputManager.inputType
    this.currentLevel = 1
    this.isGameOver = false
    this.scene.events.once('shutdown', this.destroy, this)
    
      // Add and play the music
      // this.music = this.scene.sound.add('overworld');
      // this.music.play({
      //     loop: true
      // });

      this.textTimers = [];
      this.tilesGroup = this.scene.add.group()
      this.gameTextGroup = this.scene.add.group({ runChildUpdate: true })
      this.bullets = this.scene.add.group({ runChildUpdate: true })
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
  	if(this.inputType ==='Touch') {
  		this.inputManager.gameTextRemoved(answerText)
  	}
  }

  onGameTextSelected(answerText) {
  	if(this.inputType === 'Touch') {
 			this.inputManager.setAnswerText(answerText)
	  	this.gameTextGroup.getChildren().forEach((gameText) => gameText.toggleSelected(answerText))
		}
  }

  startLevel() {
    // if input setup up failed, do not start game
    if (this.isGameOver || !this.inputManager.setupSuccess) { return false }
    //set random word timer
    this.startText = this.scene.add.text(this.gameBoundsXLeft + 100, 200, this.scene.registry.get('startText'), { fill: "#00ff00", fontSize: 30 })
    if (this.inputType === 'Keyboard') {
    	this.keysText = this.scene.add.text(this.gameBoundsXLeft + 100, 300, 'For ä,ö,ü & ß input on english keyboard use the buttons or 1, 2, 3, 4 keys respectively.', { fill: "#00ff00", fontSize: 20 })
    } else if (this.inputType === 'Touch') {
    	this.keysText = this.scene.add.text(this.gameBoundsXLeft + 100, 300, 'Switch to landscape view', { fill: "#00ff00", fontSize: 20 })
    } else {
      this.keysText = this.scene.add.text(this.gameBoundsXLeft + 100, 300, 'Press "Talk" button, and then say the answer', { fill: "#00ff00", fontSize: 20 })
    }
    this.levelRunning = false
    this.startLevelText = this.scene.add.text(this.gameBoundsXLeft + 100, 250, 'Starting Level ' + this.currentLevel +  ' in 5', { fill: "#00ff00", fontSize: 30 })
    this.countDownEvent = this.scene.time.addEvent({delay: 1000, callback: this.startLevelCallback, callbackScope: this, repeat: 4})
  }

  startLevelCallback() {
    if (this.countDownEvent.getRepeatCount() !== 0) {
      this.startLevelText.setText('Starting Level ' + this.currentLevel +  ' in ' + (this.countDownEvent.getRepeatCount() + 1))
     } else {
      
      this.startLevelText.destroy()
      this.startText.destroy()
      this.keysText.destroy()
      this.inputManager.setText('')
      this.levelRunning = true
      this.levelText.startLevel(this.currentLevel, this.levelTimeSeconds, () => this.nextLevel())
      this.spawnFallingText()
      this.setRandomTextTimer(this.spawnBonusText, 15000, 50000)
      this.setRandomTextTimer(this.spawnBonusFallingText, 1500, 50000)
    }  
  }

  nextLevel() {
    if (this.isGameOver) { return }
    this.endLevel()
    this.currentLevel = this.currentLevel + 1
    this.fallingSpeed = this.fallingSpeed + INCREASE_FALLING_SPEED_PER_LEVEL
    this.bonusFallingSpeed = this.bonusFallingSpeed + INCREASE_FALLING_SPEED_PER_LEVEL
    this.fallingTextTimerFrom = this.fallingTextTimerFrom - (Math.round(this.fallingTextTimerFrom * PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE))
    this.fallingTextTimerTo = this.fallingTextTimerTo - (Math.round(this.fallingTextTimerTo * PER_LEVEL_FALLING_TEXT_TIMER_CHANGE_PERCENTAGE))
    this.bonusTextTimerFrom = this.bonusTextTimerFrom -  (Math.round(this.bonusTextTimerFrom * PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE))
    this.bonusTextTimerTo = this.bonusTextTimerTo -  (Math.round(this.bonusTextTimerTo * PER_LEVEL_BONUS_TEXT_TIMER_CHANGE_PERCENTAGE))
    this.fallingTextTimerFrom = Math.max(500, this.fallingTextTimerFrom)
    this.fallingTextTimerTo = Math.max(this.fallingTextTimerFrom + 1000, this.fallingTextTimerTo)
    this.bonusTextTimerFrom = Math.max(1000, this.bonusTextTimerFrom)
    this.bonusTextTimerTo = Math.max(this.bonusTextTimerFrom + 1000, this.bonusTextTimerTo)
    this.startLevel()
  }

  destroy() {
    this.isGameOver = true
    this.levelRunning = false
    this.textTimers = []
    // Phaser has already destroyed the scene's groups and timers on shutdown.
    this.synth?.cancel()
  }

  endLevel() {
    this.levelRunning = false
    this.countDownEvent?.remove()
    this.levelText.stopLevel()
    this.textTimers.forEach((timer) => timer.remove())
    this.textTimers = []
    this.inputManager.setAnswerText('')
    this.gameTextGroup.clear(true,true)
    this.bullets.clear(true,true)
    for (const text of [this.startText, this.keysText, this.startLevelText]) {
      if (text?.scene) { text.destroy() }
    }
  }

  setRandomTextTimer(func, fromDelay, toDelay) {
    if (!this.levelRunning || this.isGameOver) { return }
    const timer = this.scene.time.delayedCall(Phaser.Math.RND.between(fromDelay, toDelay), () => {
      this.textTimers = this.textTimers.filter((entry) => entry !== timer)
      if (this.levelRunning && !this.isGameOver) { func.call(this) }
    })
    this.textTimers.push(timer)
  }

  speak(text) {
    if (!this.synth) { return }
    if (this.synth.speaking) { return }
    this.utterence.text = text
    this.synth.speak(this.utterence)
  }

  fire(answerText, shake = true) {
    if (!this.levelRunning || this.isGameOver) { return false }
    const normalize = (text) => text.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
    let t = normalize(answerText)
    if (t === '') { return }

    let hasHit = false

    this.gameTextGroup.getChildren().forEach((fallingText) => {
      if (fallingText.isActive && !fallingText.isTargeted && normalize(fallingText.getAnswer()) === t) {
        fallingText.isTargeted = true
        this.speak(fallingText.getVoice())
        let b = new Bullet({
              scene: this.scene,
              y: this.gameBoundsYBottom,
              target: fallingText
            })
        this.bullets.add(b, this.scene)
        b.collider = this.scene.physics.add.overlap(b, fallingText, this.hit, null, this)
        
        hasHit = true
      }
    })
    if (!hasHit && shake) {
      this.scene.cameras.main.shake(100, 0.05);
      this.scene.sound.playAudioSprite('sfx', 'smb_bump');
    }
    return hasHit
  }

  hit(bullet, fallingText) {
    if (!fallingText.isActive) {
      bullet.destroy()
      return false
    }
    let score = fallingText.getScore()
    score = score  + Math.round(( score * (this.currentLevel / 10 )))
    this.scoreText.updateScore(score, fallingText.textType.startsWith('bonus') )
    bullet.destroy()
    fallingText.hit()

    if (this.gameTextGroup.countActive(true) === 0 ) {this.spawnFallingText(false)}
  }

  smashBlock(fallingText, block) {
    if (!fallingText.isActive || !block.active || this.isGameOver) { return }
    block.blowUp()
    fallingText.blowUp()
    if (this.tilesGroup.getLength() === 0 ) {   
      this.gameOver()
    }
  }

  gameOver() {
    if (this.isGameOver) { return }
    this.isGameOver = true
    if (this.music) {this.music.stop()}
    this.endLevel()
    this.funcOnGameOver(this.scoreText.getScore())
  }

  spawnFallingText(setTimer = true) {
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
      fallingSpeed: this.fallingSpeed,
			gameBoundsXLeft:this.gameBoundsXLeft,
			gameBoundsXRight: this.gameBoundsXRight,
			gameBoundsYTop: this.gameBoundsYTop,
			gameBoundsYBottom: this.gameBoundsYBottom,
			onGameTextSelected: this.onGameTextSelected,
			onGameTextRemoved: this.onGameTextRemoved,
			context: this
    })
    this.gameTextGroup.add(b, this)

    if (setTimer) {
      this.setRandomTextTimer(
        this.spawnFallingText,
        this.fallingTextTimerFrom,
        this.fallingTextTimerTo
      )
    }
  }

  spawnBonusFallingText() {
    let remainingBlocks = null
    if (this.tilesGroup.getLength() < 50) {
      remainingBlocks = this.tilesGroup.getChildren().map((block) => block.x)
    }

    let b = GameTextFactory({
      scene: this.scene,
      textType: "bonusfalling",
      opts: { fill: "#F21536", fontSize: 30 },
      remainingBlocks,
      blockSize: this.blockSize,
      fallingSpeed: this.bonusFallingSpeed,
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
      this.spawnBonusFallingText,
      this.bonusTextTimerFrom,
      this.bonusTextTimerTo
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
        const row = rows.find((entry) => !entry.x.includes(randomX))
        if (row) { row.x.push(randomX) }
        else { rows.push({ y: undefined, x: [randomX] }) }
        i++
    }
    rows.forEach((row, rowIndex) => {
      let y = ((this.gameBoundsYBottom) - (this.blockSize/2)) - (rowIndex * (this.blockSize + 1))
      row.y = y
    })
   
    return rows
  }

  getRandomTileX () {

    return (Phaser.Math.RND.between(0,(this.playWidth/this.blockSize)-1) * this.blockSize) + (this.blockSize/2) + this.gameBoundsXLeft
  }

}