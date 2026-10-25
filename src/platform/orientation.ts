import type Phaser from 'phaser';

export function isPortrait(): boolean {
  return window.matchMedia('(orientation: portrait)').matches;
}

export function checkOrientation(scene: Phaser.Scene): void {
  if (scene.sys.game.device.os.desktop || !isPortrait() || !scene.scene.isActive()) return;
  scene.scene.run('OrientationScene', { returnScene: scene.sys.settings.key });
  scene.scene.pause();
}

export function setupOrientation(scene: Phaser.Scene): void {
  const handler = (): void => checkOrientation(scene);
  scene.scale.on('orientationchange', handler);
  scene.scale.on('resize', handler);
  scene.events.once('shutdown', () => {
    scene.scale.off('orientationchange', handler);
    scene.scale.off('resize', handler);
  });
}

export function enterMobileFullscreen(scene: Phaser.Scene): void {
  if (!scene.sys.game.device.os.desktop && !scene.scale.isFullscreen) scene.scale.startFullscreen();
}
