import type Phaser from 'phaser';
import { GAME } from '../config';
import type { Playfield } from '../core/types';
import TouchButton from './TouchButton';

const LAYOUT = { pageSize: 6, padding: 12, gap: 8, keyHeight: 82, pagerHeight: 88 } as const;

/** Keeps character choices large and in stable positions for the selected question. */
export default class TouchChoicePanel {
  private readonly keys: TouchButton[] = [];
  private readonly previous: TouchButton;
  private readonly next: TouchButton;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly hint: Phaser.GameObjects.Text;
  private choices: readonly string[] = [];
  private page = 0;

  constructor(scene: Phaser.Scene, private readonly bounds: Playfield, onChoose: (value: string) => void) {
    this.background = scene.add.graphics().fillStyle(0x162533).setDepth(3);
    this.background.fillRect(0, bounds.top, bounds.sideWidth, bounds.bottom - bounds.top);
    this.background.fillRect(bounds.right, bounds.top, bounds.sideWidth, bounds.bottom - bounds.top);
    this.hint = scene.add.text(bounds.sideWidth / 2, (bounds.top + bounds.bottom) / 2,
      'Tap a word,\nthen build\nits answer.', { color: '#d0e5ed', fontSize: 26, align: 'center' }).setOrigin(0.5).setDepth(12);
    const width = bounds.sideWidth - LAYOUT.padding * 2;
    for (let slot = 0; slot < LAYOUT.pageSize; slot++) {
      this.keys.push(new TouchButton(scene, 0, 0, width, LAYOUT.keyHeight, 72, () => {
        const choice = this.choices[this.page * LAYOUT.pageSize + slot];
        if (choice !== undefined) onChoose(choice);
      }));
    }
    const y = bounds.bottom - LAYOUT.padding - LAYOUT.pagerHeight / 2;
    this.previous = new TouchButton(scene, bounds.sideWidth / 2, y, width, LAYOUT.pagerHeight, 28,
      () => { this.page--; this.render(); });
    this.next = new TouchButton(scene, GAME.width - bounds.sideWidth / 2, y, width, LAYOUT.pagerHeight, 28,
      () => { this.page++; this.render(); });
    this.render();
  }

  show(choices: readonly string[]): void {
    this.choices = choices;
    this.page = 0;
    this.render();
  }

  cancelPress(): void {
    for (const key of this.keys) key.cancelPress();
    this.previous.cancelPress();
    this.next.cancelPress();
  }

  private render(): void {
    const pages = Math.max(1, Math.ceil(this.choices.length / LAYOUT.pageSize));
    const paged = pages > 1;
    this.keys.forEach((button, slot) => {
      const choice = this.choices[this.page * LAYOUT.pageSize + slot];
      button.setVisible(choice !== undefined).setEnabled(choice !== undefined);
      if (choice === undefined) return;
      const x = slot % 2 === 0 ? this.bounds.sideWidth / 2 : GAME.width - this.bounds.sideWidth / 2;
      button.setPosition(x, this.bounds.top + LAYOUT.padding + LAYOUT.keyHeight / 2
        + Math.floor(slot / 2) * (LAYOUT.keyHeight + LAYOUT.gap)).setLabel(choice);
    });
    this.hint.setVisible(this.choices.length === 0);
    this.previous.setVisible(paged).setLabel(`‹ Back\n${this.page + 1}/${pages}`).setEnabled(this.page > 0);
    this.next.setVisible(paged).setLabel(`More ›\n${this.page + 1}/${pages}`).setEnabled(this.page + 1 < pages);
  }

  destroy(): void {
    for (const key of this.keys) key.destroy();
    this.previous.destroy();
    this.next.destroy();
    this.background.destroy();
    this.hint.destroy();
  }
}
