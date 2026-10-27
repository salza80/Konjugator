import type Phaser from 'phaser';

/** Run once for either a scene transition or host-driven game destruction. */
export function onSceneEnd(scene: Phaser.Scene, cleanup: () => void): void {
  const finish = (): void => {
    scene.events.off('shutdown', finish);
    scene.events.off('destroy', finish);
    cleanup();
  };
  scene.events.once('shutdown', finish);
  scene.events.once('destroy', finish);
}
