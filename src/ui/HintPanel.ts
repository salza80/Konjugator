import type Phaser from 'phaser';
import ActionButton from './ActionButton';
import { fitText } from './fitText';

/** Reading stays paused; long plugin hints use pages rather than tiny text. */
export default class HintPanel {
  constructor(scene: Phaser.Scene, center: number, y: number, hint: string) {
    const characters = Array.from(hint.replace(/\s+/gu, ' ').trim());
    const pages: string[] = [];
    for (let start = 0; start < characters.length;) {
      let end = Math.min(start + 100, characters.length);
      if (end < characters.length) {
        for (let split = end; split > start + 50; split--) {
          if (/\s/u.test(characters[split] ?? '')) { end = split; break; }
        }
      }
      pages.push(characters.slice(start, end).join('').trim());
      start = end;
    }
    if (!pages.length) return;
    let page = 0;
    const text = scene.add.text(center, y, '', { color: '#e9f1f7', fontSize: 26, align: 'center' }).setOrigin(0.5, 0);
    const renderText = (): void => {
      text.setText(`Hint: ${pages[page]}`);
      fitText(text, 1000, 75, 26);
    };
    if (pages.length > 1) {
      const count = scene.add.text(center, y + 115, '', { color: '#c0d3df', fontSize: 26 }).setOrigin(0.5, 0);
      const render = (): void => {
        renderText();
        count.setText(`${page + 1}/${pages.length}`);
        previous.setEnabled(page > 0);
        next.setEnabled(page < pages.length - 1);
      };
      const previous = new ActionButton(scene, center - 260, y + 90, '‹ Back', () => { page--; render(); }, 220).setOrigin(0.5, 0);
      const next = new ActionButton(scene, center + 260, y + 90, 'More ›', () => { page++; render(); }, 220).setOrigin(0.5, 0);
      render();
    } else renderText();
  }
}
