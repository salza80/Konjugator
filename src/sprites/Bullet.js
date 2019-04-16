/*
Generic enemy class that extends Phaser sprites.
Classes for enemy types extend this class.
*/


export default class Bullet extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);
        config.scene.physics.world.enable(this);
      
        // start still and wait until needed
        // this.body.setCollideWorldBounds(true);
        this.body.allowGravity = false;

        this.body.setVelocityY(-100)
        // Standard sprite is 16x16 pixels with a smaller body
        this.setSize(5, 10);
        this.setDisplaySize(5, 10)
        

    // If you've scaled a Sprite by altering its `width`, `height`, or `scale` and you want to
    // position the Body relative to the Sprite's dimensions (which will differ from its texture's
    // dimensions), you should divide these arguments by the Sprite's current scale:
    //
        this.body.setSize(5 / this.scaleX, 10 / this.scaleY)
    //

        // this.body.offset.set(10, 12);
    }

    blowUp() {
      this.destroy()

    }
    
}
