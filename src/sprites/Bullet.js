export default class Bullet extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, 0, config.y, 'bullet');
    config.scene.physics.world.enable(this);
    this.body.allowGravity = false;
    this.body.setSize(5 / this.scaleX, 10 / this.scaleY);
    this.scene.sound.playAudioSprite('sfx', 'smb_fireball');
    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;

    this.body.world.on('worldbounds', this.OutOfBounds, this);
    this.target = config.target;

    if (this.target.textType !== 'bonus') {
        this.body.setVelocityY(-200);
        this.setX(this.target.x + (this.target.width / 2));
    } else {
        this.setX(500);
    }
  }

  moveToTarget() {
    let currentPoint = new Phaser.Geom.Point(this.x,this.y);
    let targetPoint = new Phaser.Geom.Point((this.target.x + this.target.width/2), this.target.y);
    this.rotation = Phaser.Math.Angle.BetweenPoints(currentPoint, targetPoint);
    this.scene.physics.moveTo(this, targetPoint.x, targetPoint.y, 500);

  }

  OutOfBounds(body) {
    if (this === body.gameObject) {
      this.destroy()
    }

  }

  blowUp() {
    this.destroy()
  }

  update() {
    if (this.target.textType === 'bonus') {
      this.moveToTarget()
    }
  }
}
