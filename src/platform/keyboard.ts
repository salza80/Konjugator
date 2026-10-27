import type Phaser from 'phaser';
import { onSceneEnd } from './lifecycle';

const inputs = new WeakMap<Phaser.Game, Set<HTMLElement>>();

export function hasGameFocus(game: Phaser.Game): boolean {
  return document.activeElement === game.canvas || inputs.get(game)?.has(document.activeElement as HTMLElement) === true;
}

export function registerGameInput(game: Phaser.Game, input: HTMLElement): () => void {
  const owned = inputs.get(game) ?? new Set<HTMLElement>();
  inputs.set(game, owned);
  owned.add(input);
  return () => { owned.delete(input); if (!owned.size) inputs.delete(game); };
}

/** Scene shortcuts belong to the focused game, never the embedding page. */
export function canvasShortcuts(scene: Phaser.Scene, actions: Readonly<Record<string, () => void>>): void {
  const focus = (): void => scene.game.canvas.focus({ preventScroll: true });
  const onKey = (event: KeyboardEvent): void => {
    if (!scene.scene.isActive() || !hasGameFocus(scene.game) || event.repeat || event.defaultPrevented
      || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const action = actions[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    action();
  };
  document.addEventListener('keydown', onKey);
  scene.input.on('pointerdown', focus);
  onSceneEnd(scene, () => {
    document.removeEventListener('keydown', onKey);
    scene.input.off('pointerdown', focus);
  });
}
