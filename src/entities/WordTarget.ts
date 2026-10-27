import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import { WORD_VARIANTS } from '../core/rules';
import type { Bounds, Playfield, Word, WordKind } from '../core/types';
import { contains, TARGET_LAYOUT } from '../core/targetLayout';
import { fitText } from '../ui/fitText';

interface TargetConfig {
  scene: Phaser.Scene;
  word: Word;
  kind: WordKind;
  bounds: Playfield;
  playBounds: Bounds;
  onSelect: (target: WordTarget) => void;
  onRemove: (target: WordTarget) => void;
  onMiss: (target: WordTarget) => void;
}

export default class WordTarget extends Phaser.GameObjects.Text {
  declare body: Phaser.Physics.Arcade.Body;
  readonly word: Word;
  readonly kind: WordKind;
  override state: 'active' | 'resolved' = 'active';
  private readonly bounds: Playfield;
  private readonly playBounds: Bounds;
  private readonly onRemove: (target: WordTarget) => void;
  private readonly onMiss: (target: WordTarget) => void;
  private flash?: Phaser.Time.TimerEvent;
  private removal?: Phaser.Time.TimerEvent;

  constructor(config: TargetConfig) {
    const variant = WORD_VARIANTS[config.kind];
    super(config.scene, 0, 0, config.word.question, { color: variant.color, fontSize: variant.fontSize });
    this.word = config.word;
    this.kind = config.kind;
    this.bounds = config.bounds;
    this.playBounds = config.playBounds;
    this.onRemove = config.onRemove;
    this.onMiss = config.onMiss;
    config.scene.add.existing(this);
    this.setAlign('center').setVisible(false).setDepth(2);
    fitText(this, Math.min(TARGET_LAYOUT.maxWidth, this.playBounds.right - this.playBounds.left - 20),
      this.kind === 'bonus' ? TARGET_LAYOUT.bonusHeight - 16 : (this.playBounds.bottom - this.playBounds.top) / 3, variant.fontSize);
    const tapPadding = TARGET_LAYOUT.gap / 2;
    this.setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(-tapPadding, -tapPadding, this.width + tapPadding * 2, this.height + tapPadding * 2),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });
    this.on('pointerdown', () => { if (this.isPlayable) config.onSelect(this); });
  }

  get isPlayable(): boolean {
    return this.state === 'active' && this.visible && contains(this.playBounds,
      { x: this.x, y: this.y, width: this.displayWidth, height: this.displayHeight });
  }

  start(x: number, y: number, speed: number, fromRight = false, horizontalSpeed: number = GAME.horizontalWordSpeed): void {
    this.setPosition(x, y).setVisible(true);
    this.scene.physics.world.enable(this);
    this.body.setSize(this.width, this.height).reset(x, y);
    if (this.kind === 'bonus') {
      this.body.setAllowGravity(false).setVelocityX(fromRight ? -horizontalSpeed : horizontalSpeed);
      this.scene.sound.playAudioSprite('sfx', 'smb_powerup_appears');
    } else {
      this.body.setAllowGravity(true).setMaxSpeed(speed);
      if (this.kind === 'bonusfalling') {
        this.scene.sound.playAudioSprite('sfx', 'smb_warning');
        this.flash = this.scene.time.addEvent({
          delay: 100, loop: true,
          callback: () => this.isTinted ? this.clearTint() : this.setTint(0xff8888),
        });
      }
    }
  }

  override update(): void {
    if (this.state === 'resolved') return;
    this.cropToPlayfield();
    if (this.kind === 'bonus') {
      if (this.x > this.bounds.right || this.x + this.displayWidth < this.bounds.left) {
        this.resolve(false);
        this.onMiss(this);
      }
    } else if (this.y >= this.bounds.bottom - this.displayHeight + 5) {
      this.resolve(false);
      this.onMiss(this);
    }
  }

  /** Texture cropping works in both Phaser's Canvas and WebGL renderers. */
  private cropToPlayfield(): void {
    if (this.isPlayable) {
      if (this.isCropped) this.setCrop();
      return;
    }
    const left = Phaser.Math.Clamp((this.playBounds.left - this.x) / this.scaleX, 0, this.width);
    const top = Phaser.Math.Clamp((this.playBounds.top - this.y) / this.scaleY, 0, this.height);
    const right = Phaser.Math.Clamp((this.playBounds.right - this.x) / this.scaleX, 0, this.width);
    const bottom = Phaser.Math.Clamp((this.playBounds.bottom - this.y) / this.scaleY, 0, this.height);
    const resolution = this.style.resolution;
    this.setCrop(left * resolution, top * resolution, Math.max(0, right - left) * resolution,
      Math.max(0, bottom - top) * resolution);
  }

  setSpeed(speed: number, horizontalSpeed: number): void {
    if (this.state !== 'active') return;
    if (this.kind === 'bonus') this.body.setVelocityX(Math.sign(this.body.velocity.x) * horizontalSpeed);
    else this.body.setMaxSpeed(speed);
  }

  select(selected: boolean): void {
    if (this.state !== 'resolved') this.setBackgroundColor(selected ? COLORS.selected : 'transparent');
  }

  resolve(hit: boolean, points?: number): void {
    if (this.state === 'resolved') return;
    const feedbackWidth = this.displayWidth + TARGET_LAYOUT.gap / 2;
    if (hit) this.scene.sound.playAudioSprite('sfx', WORD_VARIANTS[this.kind].hitSound);
    this.state = 'resolved';
    this.body.stop();
    this.body.enable = false;
    this.setActive(false).disableInteractive().setCrop().setBackgroundColor('transparent');
    this.flash?.remove();
    this.clearTint();
    const label = hit ? `✓ ${this.word.answer}${points === undefined ? '' : `  +${points}`}`
      : `Missed\n${this.word.question}\nAnswer: ${this.word.answer}`;
    this.setText(this.word.tip ? `${label}\nHint: ${this.word.tip}` : label);
    this.setColor(hit ? COLORS.success : '#e9f1f7');
    this.setBackgroundColor(hit ? '#12202b' : '#35202b').setPadding(12, 8).setDepth(1);
    fitText(this, Math.min(feedbackWidth, this.bounds.width - 20), (this.bounds.bottom - this.bounds.top) / 2, 26);
    this.setY(Math.max(this.bounds.top, Math.min(this.y, this.bounds.bottom - this.displayHeight)));
    this.clampPosition();
    this.removal = this.scene.time.delayedCall(hit ? GAME.answerDisplayMs : GAME.correctionDisplayMs, () => this.destroy());
  }

  private clampPosition(): void {
    this.setX(Math.max(this.bounds.left, Math.min(this.x, this.bounds.right - this.displayWidth)));
  }

  protected override preDestroy(): void {
    this.flash?.remove();
    this.removal?.remove();
    this.onRemove(this);
    super.preDestroy();
  }
}
