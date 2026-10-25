export function isPortrait() {
  return window.matchMedia('(orientation: portrait)').matches
}

export function checkOrientation(scene) {
  if (scene.sys.game.device.os.desktop || !isPortrait()) { return }
  const overlay = scene.scene.get('OrientationScene')
  overlay.returnScene = scene.sys.settings.key
  scene.scene.run('OrientationScene')
  scene.scene.pause()
}

export function setupOrientation(scene) {
  scene.orientationHandler && scene.scale.off('orientationchange', scene.orientationHandler)
  scene.orientationHandler = () => {
    if (scene.scene.isActive()) { checkOrientation(scene) }
  }
  scene.scale.on('orientationchange', scene.orientationHandler)
  scene.scale.on('resize', scene.orientationHandler)
  scene.events.once('shutdown', () => {
    scene.scale.off('orientationchange', scene.orientationHandler)
    scene.scale.off('resize', scene.orientationHandler)
  })
}
