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
