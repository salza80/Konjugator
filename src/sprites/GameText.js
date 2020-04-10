import { getRandomInt } from '../helpers/util.js'
const BOTTOM_Y = 600



class GameText extends Phaser.GameObjects.Text {
  constructor(config) {
    super(config.scene, 0, 0, '', config.opts)
    this.gameWidth = config.gameWidth
    this.blockSize = config.blockSize
    this.offsetX = config.offsetX

    this.gameBoundsXLeft = this.offsetX
    this.gameBoundsXRight = this.offsetX + this.gameWidth
    this.gameBoundsYTop = 0
    this.gameBoundsYBottom = BOTTOM_Y

    config.scene.physics.world.enable(this);
    this.textType = config.textType
    // set random verb
    this.hitSound = 'smb_coin'
    var verbs = this.scene.cache.json.get('verbs')
    let verbKeys = Object.keys(verbs)
    this.verb = verbKeys[getRandomInt(0, verbKeys.length -1)]
    let subjectKeys = Object.keys(verbs[this.verb])
    // -2 to avoid english
    this.subject = subjectKeys[getRandomInt(0, subjectKeys.length -2)]
    this.answer = verbs[this.verb][this.subject]
    this.english = verbs[this.verb]['english']

    this.setText(this.subject + ' (' + this.verb + ')')
    
    this.body.debugShowBody = true
    this.body.debugBodyColor = 0x0000ff;

    // If you've scaled a Sprite by altering its `width`, `height`, or `scale` and you want to
    // position the Body relative to the Sprite's dimensions (which will differ from its texture's
    // dimensions), you should divide these arguments by the Sprite's current scale:

            
    this.body.setSize(this.width, this.height)

    this.setInteractive()
    this.on('pointerup', () => {
      this.scene.events.emit("GameTextSelected", this);
    });
    this.scene.events.on('GameTextSelected', (gameText) => {
      this.toggleSelected(gameText);
    });

  }

  isOutOfBounds() {
    if (this.y >= 750 || this.y < 0) {
      return true
    }
    if (this.x >= this.gameBoundsXRight + 100 || this.x < this.gameBoundsXLeft - 100) {
      return true
    }
    return false
  }

  update() {
    if (this.isOutOfBounds()) {
      this.onOutOfBounds()
    }
  }

  showAnswerAndRemove() {
    this.body.setMaxSpeed(0)
    this.setText(`${this.answer} (${this.english})`)
    this.setStyle({ fill: '#ff0'});
    this.scene.events.emit('GameTextRemoved', this)
    this.scene.time.addEvent({delay:600, callback: this.destroy, callbackScope: this})
  }

  getAnswer() {
    return this.answer
  }

  blowUp() {
    this.showAnswerAndRemove()
    this.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
  }

  onOutOfBounds(){
    this.scene.events.emit('GameTextRemoved', this)
    this.destroy()
  }

  hit() {
    this.scene.sound.playAudioSprite('sfx',  this.hitSound)
    this.showAnswerAndRemove()
  }

  getScore () {
    return this.answer.length * 2
  }

  toggleSelected(gameText) {
    try {
      if (this === gameText){
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

    //if remaining blocks are passed, set x to a remaining block 50% of the time
    if (config.remainingBlocks && getRandomInt(0,1) === 1) {
      this.setX(config.remainingBlocks[getRandomInt(0, config.remainingBlocks.length - 1)])
    } else {
      this.setX(this.getRandomTileX())
    }
    //reposition if text is off screen
    if (this.x + this.width > this.gameBoundsXRight ){
      this.setX(this.gameBoundsXRight-this.width)
    }
    this.body.allowGravity = true;
    this.body.setMaxSpeed(35)
   }

  isOutOfBounds() {
    if (this.y >= this.gameBoundsYBottom ) {
      return true
    }
    return false
  }

  onOutOfBounds(){
    this.showAnswerAndRemove()
  }

  getRandomTileX () {
    return getRandomInt(0,this.gameWidth/this.blockSize) * this.blockSize + this.offsetX
  }

}

class BonusText extends GameText {
  constructor(config) {
    super(config)
    this.hitSound = 'smb_powerup'
    this.body.allowGravity = false;
    let LeftorRight = getRandomInt(0,2)
    if (LeftorRight === 0) {
      this.bonusDirection = 'left'
      this.setX(this.gameBoundsXRight + 100)
      this.setY(getRandomInt(50, 400))
      this.body.setVelocityX(-70)
    } else {
      this.bonusDirection = 'right'
      this.setX(0)
      this.setY(getRandomInt(50, 400))
      this.body.setVelocityX(70)
    }
    this.scene.sound.playAudioSprite('sfx', 'smb_powerup_appears');
  }

  getScore () {
    return (this.answer.length * 10) 
  }
}

export default function GameTextFactory(config) {
  if (config.textType === 'bonus') { 
    return new BonusText(config)
  } else {
    return new FallingText(config)
  }
}
