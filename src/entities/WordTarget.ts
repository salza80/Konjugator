import Phaser from 'phaser';
import { COLORS, GAME } from '../config';
import { WORD_VARIANTS } from '../core/rules';
import type { Playfield, Word, WordKind } from '../core/types';

interface TargetConfig {
  scene: Phaser.Scene;
  word: Word;
  kind: WordKind;
  bounds: Playfield;
  speed: number;
  remainingBlocks: readonly number[];
  onSelect: (target: WordTarget) => void;
  onRemove: (target: WordTarget) => void;
}

export default class WordTarget extends Phaser.GameObjects.Text {
  declare body: Phaser.Physics.Arcade.Body;
  readonly word: Word;
  readonly kind: WordKind;
  override state: 'active' | 'targeted' | 'resolved' = 'active';
  private readonly bounds: Playfield;
  private readonly onRemove: (target: WordTarget) => void;
  private flash?: Phaser.Time.TimerEvent;
  private removal?: Phaser.Time.TimerEvent;

  constructor(config: TargetConfig) {
    const variant = WORD_VARIANTS[config.kind];
    super(config.scene, 0, 0, config.word.question, { color: variant.color, fontSize: variant.fontSize });
    this.word = config.word;
    this.kind = config.kind;
    this.bounds = config.bounds;
    this.onRemove = config.onRemove;
    config.scene.add.existing(this);
    config.scene.physics.world.enable(this);
    this.setWordWrapWidth(this.width).setAlign('center');
    this.body.setSize(this.width, this.height);
    this.setInteractive();
    this.on('pointerup', () => {
      if (this.state !== 'resolved') config.onSelect(this);
    });

    if (this.kind === 'bonus') {
      this.body.setAllowGravity(false);
      const fromRight = Phaser.Math.Between(0, 2) === 0;
      this.setPosition(fromRight ? this.bounds.right + this.width : this.bounds.left - this.width, Phaser.Math.Between(50, 400));
      this.body.setVelocityX(fromRight ? -GAME.horizontalWordSpeed : GAME.horizontalWordSpeed);
      this.scene.sound.playAudioSprite('sfx', 'smb_powerup_appears');
    } else {
      const column = Phaser.Math.Between(0, Math.floor(this.bounds.width / GAME.blockSize));
      const targetedColumn = config.remainingBlocks.length && Phaser.Math.RND.frac() < variant.targetChance
        ? Phaser.Utils.Array.GetRandom([...config.remainingBlocks]) : undefined;
      this.setPosition(targetedColumn ?? this.bounds.left + column * GAME.blockSize, this.bounds.top - this.height);
      this.clampPosition();
      this.body.setAllowGravity(true).setMaxSpeed(config.speed);
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
    if (this.kind === 'bonus') {
      if (this.x > this.bounds.right + this.width + 10 || this.x < this.bounds.left - this.width - 10) this.destroy();
    } else if (this.y >= this.bounds.bottom - this.height + 5) {
      this.resolve(false);
    }
  }

  select(selected: boolean): void {
    if (this.state !== 'resolved') this.setBackgroundColor(selected ? COLORS.selected : 'transparent');
  }

  resolve(hit: boolean): void {
    if (this.state === 'resolved') return;
    if (hit) this.scene.sound.playAudioSprite('sfx', WORD_VARIANTS[this.kind].hitSound);
    this.state = 'resolved';
    this.body.stop();
    this.body.enable = false;
    this.setActive(false).disableInteractive().setBackgroundColor('transparent');
    this.flash?.remove();
    this.clearTint();
    this.setText(this.word.tip ? `${this.word.answer} (${this.word.tip})` : this.word.answer);
    this.setColor(COLORS.answer);
    this.clampPosition();
    this.removal = this.scene.time.delayedCall(GAME.answerDisplayMs, () => this.destroy());
  }

  private clampPosition(): void {
    this.setX(Math.max(this.bounds.left, Math.min(this.x, this.bounds.right - this.width)));
  }

  protected override preDestroy(): void {
    this.flash?.remove();
    this.removal?.remove();
    this.onRemove(this);
    super.preDestroy();
  }
}
