import type Phaser from 'phaser';

/** Wrap full text (including unbroken words), then fit it inside a display area. */
export function fitText(text: Phaser.GameObjects.Text, width: number, height: number, fontSize: number): void {
  text.setScale(1).setFontSize(fontSize);
  text.setWordWrapWidth(Math.max(1, width - (text.padding.left ?? 0) - (text.padding.right ?? 0)), true);
  // Prefer readable wrapping before reducing unusually large supplied content.
  while (text.height > height && fontSize > 16) {
    fontSize = Math.max(16, fontSize - 2);
    text.setFontSize(fontSize);
  }
  const scale = Math.min(1, width / Math.max(1, text.width), height / Math.max(1, text.height));
  text.setScale(scale);
}

/** Keep auxiliary hints readable; the pause view provides the expanded text. */
export function singleLine(text: Phaser.GameObjects.Text, value: string, width: number, fontSize: number): void {
  text.setScale(1).setFontSize(fontSize).setWordWrapWidth(0);
  const characters = Array.from(value.replace(/\s+/gu, ' ').trim());
  let end = Math.min(characters.length, Math.ceil(width / (fontSize / 4)));
  do {
    text.setText(characters.slice(0, end).join('') + (end < characters.length ? '…' : ''));
    if (text.width <= width || end === 0) break;
    end--;
  } while (end >= 0);
}
