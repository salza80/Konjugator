import Phaser from 'phaser';
import { GAME } from '../config';
import WordTarget from './WordTarget';

export default class Bullet extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  collider?: Phaser.Physics.Arcade.Collider;

  constructor(scene: Phaser.Scene, y: number, readonly target: WordTarget, launchX: number) {
    super(scene, target.kind === 'bonus' ? launchX : target.x + target.width / 2, y, 'bullet');
    scene.add.existing(this);
    scene.physics.world.enable(this);
    this.body.setAllowGravity(false).setSize(5 / this.scaleX, 10 / this.scaleY);
    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;
    this.body.world.on('worldbounds', this.onWorldBounds, this);
    if (target.kind !== 'bonus') this.body.setVelocityY(-GAME.bulletSpeed);
    scene.sound.playAudioSprite('sfx', 'smb_fireball');
  }

  override update(): void {
    if (!this.target.scene || this.target.state === 'resolved') {
      this.destroy();
      return;
    }
    if (this.target.kind === 'bonus') {
      const x = this.target.x + this.target.width / 2;
      this.rotation = Phaser.Math.Angle.Between(this.x, this.y, x, this.target.y);
      this.scene.physics.moveTo(this, x, this.target.y, GAME.homingBulletSpeed);
    }
  }

  private onWorldBounds(body: Phaser.Physics.Arcade.Body): void {
    if (body.gameObject === this) this.destroy();
  }

  override destroy(fromScene?: boolean): void {
    if (!this.scene) return;
    this.body?.world?.off('worldbounds', this.onWorldBounds, this);
    this.collider?.destroy();
    if (this.target.state === 'targeted') this.target.state = 'active';
    super.destroy(fromScene);
  }
}
