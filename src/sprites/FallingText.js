import { getRandomInt } from '../helpers/util.js'
/*
Generic enemy class that extends Phaser sprites.
Classes for enemy types extend this class.
*/

export default class FallingText extends Phaser.GameObjects.Text {
    constructor(config) {
        super(config.scene, 0, 0, '', config.opts)
        config.scene.physics.world.enable(this);

        // set random verb
        var verbs = this.scene.cache.json.get('verbs')
        let verbKeys = Object.keys(verbs)
        this.verb = verbKeys[getRandomInt(0, verbKeys.length)]
        let subjectKeys = Object.keys(verbs[this.verb])
        // -1 to avoid english
        this.subject = subjectKeys[getRandomInt(0, subjectKeys.length -1)]
        this.answer = verbs[this.verb][this.subject]
        this.english = verbs[this.verb]['english']

        this.setText(this.subject + ' (' + this.verb + ')')

        this.textType = config.textType ? config.textType : 'falling'

        if (this.textType==='falling') {
            this.setX(config.x)
            this.body.allowGravity = true;
            this.body.setMaxSpeed(35)
        } else {
           // type bonus 
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
        
        this.body.debugShowBody = true
        this.body.debugBodyColor = 0x0000ff;




        // Standard sprite is 16x16 pixels with a smaller body
        // this.setSize(10, 10);
        // this.setDisplaySize(10, 10)

        
        

    // If you've scaled a Sprite by altering its `width`, `height`, or `scale` and you want to
    // position the Body relative to the Sprite's dimensions (which will differ from its texture's
    // dimensions), you should divide these arguments by the Sprite's current scale:

        
        // reposition is text is off the screen
        if (this.x + this.width > 1000 ){
            this.setX(1000-this.width)
        }
        this.body.setSize(this.width, this.height)

        this.body.onWorldBounds = true;

        this.body.world.on('worldbounds', this.OutOfBounds, this)
    //

        // this.body.offset.set(10, 12);
    }

    OutOfBounds(body) {
        if (this !== body.gameObject) { return false }

        if (this.textType === 'falling' && this.y < 100) {
            this.destroy()
            return false
        }

        if (this.bonusDirection === 'left' && this.x < 500) {
            this.destroy()
            return false;
        } 
        if (this.bonusDirection === 'right' && this.x >500) {
            this.destroy()
            return false;
        } 
    }

    blowUp() {
        this.body.setMaxSpeed(0)
        this.setText(this.answer)
        this.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
        this.scene.time.addEvent({delay:300, callback: this.destroy, callbackScope: this})
    }

    hit() {
        if (this.textType === 'falling') {
            this.scene.sound.playAudioSprite('sfx', 'smb_coin')
        } else {
            this.scene.sound.playAudioSprite('sfx', 'smb_powerup')
        }
        this.destroy()
    }

    static getRandomTileX () {
        return getRandomInt(0,100) * 10
    }
}
