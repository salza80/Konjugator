export default class Block extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, config.x, config.y, config.key);
    config.scene.physics.world.enable(this);
    this.blockSize = config.blockSize

    // start still and wait until needed
    // this.body.setCollideWorldBounds(true);
    this.body.allowGravity = false;
    this.body.setImmovable(true);
    this.beenSeen = false;


    // Standard sprite is 16x16 pixels with a smaller body
    this.setSize(this.blockSize, this.blockSize);
    this.setDisplaySize(this.blockSize, this.blockSize)

  }

  blowUp() {
    this.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
    this.destroy()
  }
}
