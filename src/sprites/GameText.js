

class GameText extends Phaser.GameObjects.Text {
  constructor(config) {
    super(config.scene, 0, 0, '', config.opts)
    this.gameWidth = config.gameBoundsXRight - config.gameBoundsXLeft
    this.blockSize = config.blockSize
    this.gameBoundsXLeft = config.gameBoundsXLeft
    this.gameBoundsXRight = config.gameBoundsXRight
    this.gameBoundsYTop = config.gameBoundsYTop
    this.gameBoundsYBottom = config.gameBoundsYBottom
    this.funcOnGameTextSelected = config.onGameTextSelected ? config.onGameTextSelected.bind(config.context) : () => {};
    this.funcOnGameTextRemoved = config.onGameTextRemoved ? config.onGameTextRemoved.bind(config.context) : () => {}
    this.isActive = true

    config.scene.physics.world.enable(this);
    this.textType = config.textType
    // set random verb
    this.hitSound = 'smb_coin'
    let words = this.scene.cache.json.get('words')
    let word = Phaser.Math.RND.pick(words)
    this.question = word.question
    this.answer = word.answer
    this.tip = word.tip
    this.voice = word.voice

    this.setText(this.question)
    this.setWordWrapWidth(this.width)
    this.setAlign('center')
    
    this.body.debugShowBody = true
    this.body.debugBodyColor = 0x0000ff;          
    this.body.setSize(this.width, this.height)

    this.setInteractive()
    this.on('pointerup', () => {
      this.funcOnGameTextSelected(this.getAnswer())
    });
  }

  isOutOfBounds() {
    if (this.y >= 750 || this.y < 0) {
      return true
    }
    if (this.x >= this.gameBoundsXRight + this.width + 10 || this.x < this.gameBoundsXLeft - 10 - this.width) {
      return true
    }
    return false
  }

  update() {
    if (this.isOutOfBounds()) {
      this.onOutOfBounds()
    }
  }

  repositionIfOffScreen() {
    //reposition if text is off screen
    if (this.x + this.width > this.gameBoundsXRight ){
      this.setX(this.gameBoundsXRight-this.width)
    }
  }

  showAnswerAndRemove() {
    this.body.setMaxSpeed(0)
    this.isActive = false
    this.setText(`${this.answer} (${this.tip})`)
    this.setStyle({ fill: '#ff0'});
    this.repositionIfOffScreen();
    this.scene.time.addEvent({delay:1500, callback: this.removeText, callbackScope: this})
  }

  getAnswer() {
    return this.answer
  }

  getVoice() {
    return this.voice || this.answer
  }

  blowUp() {
    this.showAnswerAndRemove()
  }

  onOutOfBounds(){
    this.removeText()
  }

  removeText() {
    try{
      this.funcOnGameTextRemoved(this.answer)
    }
    catch(e){
      console.log(e.message)
    }
    this.destroy()
  }

  hit() {
    this.scene.sound.playAudioSprite('sfx',  this.hitSound)
    this.showAnswerAndRemove()
  }

  getScore () {
    return this.answer.length * 2
  }

  getRandomTileX () {
    return Phaser.Math.RND.between(0, this.gameWidth/this.blockSize) * this.blockSize + this.gameBoundsXLeft
  }

  toggleSelected(answerText) {
    try {
      if (answerText === this.getAnswer()){
        this.setBackgroundColor('#070a91')
      } else {
        this.setBackgroundColor('transparent')
      }
    } catch(e) {
      console.log(e.message)
    }
  }

}

class FallingText extends GameText {
  constructor(config) {
    super(config)
    this.fallingSpeed = config.fallingSpeed ? config.fallingSpeed : 20
    this.y = this.gameBoundsYTop - this.height

    // if remaining blocks are passed, set x to a remaining block 70% of the time
    if (config.remainingBlocks && Phaser.Math.RND.between(0,10) < 8) {
      this.setX(config.remainingBlocks[Phaser.Math.RND.between(0, config.remainingBlocks.length - 1)])
    } else {
      this.setX(this.getRandomTileX())
    }
    //reposition if text is off screen
    this.repositionIfOffScreen()
    this.body.allowGravity = true;
    this.body.setMaxSpeed(this.fallingSpeed)
   }

  isOutOfBounds() {
    if (this.y >= this.gameBoundsYBottom - this.height + 5) {
      return true
    }
    return false
  }

  onOutOfBounds(){
    this.showAnswerAndRemove()
  }
}


class BonusFallingText extends GameText {
  constructor(config) {
    super(config)
    this.y = this.gameBoundsYTop - this.height
    this.hitSound = 'smb_pipe'
    this.fallingSpeed = config.fallingSpeed ? config.fallingSpeed : 40

    // if remaining blocks are passed, set x to a remaining block 40% of the time
    if (config.remainingBlocks && Phaser.Math.RND.between(0,10) < 4) {
      this.setX(config.remainingBlocks[Phaser.Math.RND.between(0, config.remainingBlocks.length - 1)])
    } else {
      this.setX(this.getRandomTileX())
    }

    // reposition if text is off screen
    this.repositionIfOffScreen()
    this.body.allowGravity = true;
    this.body.setMaxSpeed(this.fallingSpeed)
    this.flashText()

    this.scene.sound.playAudioSprite('sfx', 'smb_warning');

   }

  isOutOfBounds() {
    if (this.y >= this.gameBoundsYBottom - this.height + 5) {
      return true
    }
    return false
  }

  onOutOfBounds(){
    this.showAnswerAndRemove()
  }

  getScore () {
    return (this.answer.length * 10)
  }

  flashText () {
    this.scene.time.addEvent({ callback: () => {
      if (!this.isTinted) {
        this.setTint(0.5)
      } else { this.clearTint()}
    }, callbackScope: this, loop: true, delay: 100})
  }

}

class BonusText extends GameText {
  constructor(config) {
    super(config)
    this.hitSound = 'smb_powerup'
    this.body.allowGravity = false;
    let LeftorRight = Phaser.Math.RND.between(0,2)
    if (LeftorRight === 0) {
      this.bonusDirection = 'left'
      this.setX(this.gameBoundsXRight + this.width)
      this.setY(Phaser.Math.RND.between(50, 400))
      this.body.setVelocityX(-70)
    } else {
      this.bonusDirection = 'right'
      this.setX(this.gameBoundsXLeft - this.width)
      this.setY(Phaser.Math.RND.between(50, 400))
      this.body.setVelocityX(70)
    }
    this.scene.sound.playAudioSprite('sfx', 'smb_powerup_appears');
  }

  getScore () {
    return (this.answer.length * 40)
  }
}

export default function GameTextFactory(config) {
  if (config.textType === 'bonus') { 
    return new BonusText(config)
  } else if (config.textType === 'bonusfalling') {
    return new BonusFallingText(config)
  } else {
    return new FallingText(config)
  }
}
