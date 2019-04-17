import { getRandomInt } from '../helpers/util.js'
/*
Generic enemy class that extends Phaser sprites.
Classes for enemy types extend this class.
*/

export default class FallingText extends Phaser.GameObjects.Text {
    constructor(config) {
        super(config.scene, config.x, 0, config.text, config.opts);
        config.scene.physics.world.enable(this);
      

        // start still and wait until needed
        // this.body.setCollideWorldBounds(true);
        this.body.allowGravity = true;
        this.body.setMaxSpeed(50)
        
        this.body.debugShowBody= true
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
    //

        // this.body.offset.set(10, 12);
    }


    static getRandomTileX () {
        return getRandomInt(0,100) * 10
    }

    blowUp() {
        this.body.setMaxSpeed(0)
        this.setText('answer')
        this.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
        this.scene.time.addEvent({delay:300, callback: this.destroy, callbackScope: this})
    }

    hit() {
        this.scene.sound.playAudioSprite('sfx', 'smb_coin');
        this.destroy()
    }
}
