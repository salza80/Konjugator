import Phaser from 'phaser';
import { GAME } from '../config';

export default class Block extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'block');
    scene.add.existing(this);
    scene.physics.world.enable(this);
    this.setDisplaySize(GAME.blockSize, GAME.blockSize);
    this.body.setAllowGravity(false).setImmovable(true);
  }

  breakApart(): void {
    this.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
    this.destroy();
  }
}
