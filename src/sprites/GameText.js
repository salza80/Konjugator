import { getRandomInt } from '../helpers/util.js'

class GameText extends Phaser.GameObjects.Text {
  constructor(config) {
    super(config.scene, 0, 0, '', config.opts)
    config.scene.physics.world.enable(this);
    this.textType = config.textType
    // set random verb
    this.hitSound = 'smb_coin'
    var verbs = this.scene.cache.json.get('verbs')
    let verbKeys = Object.keys(verbs)
    this.verb = verbKeys[getRandomInt(0, verbKeys.length)]
    let subjectKeys = Object.keys(verbs[this.verb])
    // -1 to avoid english
    this.subject = subjectKeys[getRandomInt(0, subjectKeys.length -1)]
    this.answer = verbs[this.verb][this.subject]
    this.english = verbs[this.verb]['english']

    this.setText(this.subject + ' (' + this.verb + ')')
    this.setX(this.getRandomTileX())
    
    this.body.debugShowBody = true
    this.body.debugBodyColor = 0x0000ff;

    // If you've scaled a Sprite by altering its `width`, `height`, or `scale` and you want to
    // position the Body relative to the Sprite's dimensions (which will differ from its texture's
    // dimensions), you should divide these arguments by the Sprite's current scale:

            
    this.body.setSize(this.width, this.height)
    }

    isOutOfBounds() {
      if (this.y >= 750 || this.y < 0) {
        return true
      }
      if (this.x >= 1050 || this.x < -50) {
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
      this.setText(this.answer)
      this.scene.time.addEvent({delay:300, callback: this.destroy, callbackScope: this})
    }

    blowUp() {
      this.showAnswerAndRemove()
      this.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
    }

    onOutOfBounds(){
      this.destroy()
    }

    hit() {
      this.scene.sound.playAudioSprite('sfx',  this.hitSound)
      this.destroy()
    }

    getScore () {
      return this.answer.length * 2
    }

    getRandomTileX () {
      return getRandomInt(0,100) * 10
    }
}



class FallingText extends GameText {
  constructor(config) {
    super(config)

   
    //reposition if text is off screen
    if (this.x + this.width > 1000 ){
      this.setX(1000-this.width)
    }
    this.body.allowGravity = true;
    this.body.setMaxSpeed(35)
   }

  isOutOfBounds() {
    if (this.y >= 600 ) {
      return true
    }
    return false
  }

  onOutOfBounds(){
    this.showAnswerAndRemove()
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
      this.setX(1050)
      this.setY(getRandomInt(100, 400))
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
