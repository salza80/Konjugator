import Phaser from 'phaser';
import { GAME } from '../config';
import type WordTarget from './WordTarget';

/** Cosmetic shot. Answer acceptance and scoring never depend on its arrival. */
export default class Bullet extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, y: number, target: WordTarget, launchX: number) {
    const x = target.kind === 'bonus' ? launchX : target.x + target.displayWidth / 2;
    super(scene, x, y, 'bullet');
    scene.add.existing(this);
    const destination = { x: target.x + target.displayWidth / 2, y: target.y + target.displayHeight / 2 };
    this.setRotation(Phaser.Math.Angle.Between(x, y, destination.x, destination.y));
    scene.sound.playAudioSprite('sfx', 'smb_fireball');
    scene.tweens.add({
      targets: this,
      ...destination,
      duration: GAME.shotDisplayMs,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });
  }

  override destroy(fromScene?: boolean): void {
    if (!this.scene) return;
    this.scene.tweens.killTweensOf(this);
    super.destroy(fromScene);
  }
}
