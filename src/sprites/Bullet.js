/*
Generic enemy class that extends Phaser sprites.
Classes for enemy types extend this class.
*/


export default class Bullet extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, 0, config.y, 'bullet');
        config.scene.physics.world.enable(this);
      
        // start still and wait until needed
        // this.body.setCollideWorldBounds(true);
        this.body.allowGravity = false;

        
        // Standard sprite is 16x16 pixels with a smaller body
        this.setSize(5, 10);
        this.setDisplaySize(5, 10)
        

    // If you've scaled a Sprite by altering its `width`, `height`, or `scale` and you want to
    // position the Body relative to the Sprite's dimensions (which will differ from its texture's
    // dimensions), you should divide these arguments by the Sprite's current scale:
    //
        this.body.setSize(5 / this.scaleX, 10 / this.scaleY)
        this.scene.sound.playAudioSprite('sfx', 'smb_fireball');
        this.body.setCollideWorldBounds(true)
        this.body.onWorldBounds = true;

        this.body.world.on('worldbounds', this.OutOfBounds, this)
        // this.scene.physics.add.overlap(this, this.scene.physics.world.bounds, this.blowUp, null, this);
        this.target = config.target

        if (this.target.textType === 'falling') {
            this.body.setVelocityY(-100)
            this.setX(this.target.x + (this.target.width / 2))
        } else {
            this.setX(500)
            this.moveToTarget()
        }


    }

    moveToTarget() {
        let currentPoint = new Phaser.Geom.Point(this.x,this.y);﻿
        let targetPoint = new Phaser.Geom.Point(this.target.x, this.target.y);﻿﻿
        if (this.target.bonusDirection === 'right') {
            targetPoint.x = this.target.x + this.target.width
        }
        this.rotation = Phaser.Math.Angle.BetweenPoints(currentPoint, targetPoint);
        this.scene.physics.moveTo(this, targetPoint.x, targetPoint.y, 400)

    }

    OutOfBounds(body) {
        if (this === body.gameObject) {
            this.destroy()
        }

    }

    blowUp() {
        this.destroy()
    }
    
}
