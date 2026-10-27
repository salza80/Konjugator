import Phaser from 'phaser';
import { COLORS } from '../config';
import { enterMobileFullscreen, isPortrait } from '../platform/orientation';
import { onSceneEnd } from '../platform/lifecycle';
import InputButton from '../ui/InputButton';

interface OrientationData { returnScene: string }

export default class OrientationScene extends Phaser.Scene {
  private returnScene = 'TitleScene';
  private readonly content: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('OrientationScene'); }
  init(data: OrientationData): void { this.returnScene = data.returnScene; }

  create(): void {
    this.cameras.main.setBackgroundColor('#000');
    this.scene.bringToTop();
    const render = (): void => { if (this.scene.isActive()) this.renderContent(); };
    const wake = (_systems: Phaser.Scenes.Systems, data: OrientationData): void => {
      this.returnScene = data.returnScene;
      this.scene.bringToTop();
      this.renderContent();
    };
    this.scale.on('orientationchange', render);
    this.scale.on('resize', render);
    this.events.on('wake', wake);
    onSceneEnd(this, () => {
      this.scale.off('orientationchange', render);
      this.scale.off('resize', render);
      this.events.off('wake', wake);
      this.content.length = 0;
    });
    this.renderContent();
  }

  private renderContent(): void {
    for (const object of this.content) object.destroy();
    this.content.length = 0;
    if (isPortrait()) {
      this.content.push(this.add.text(100, 100, 'Switch your device to Landscape', { color: COLORS.error, fontSize: 60 }));
      ['If the screen does not rotate:', 'check Auto-rotate screen option is on (Android)', 'or Orientation Lock is off on iPhone'].forEach((text, index) => {
        this.content.push(this.add.text(100, 300 + index * 100, text, { color: COLORS.text, fontSize: 40 }));
      });
    } else {
      this.content.push(new InputButton(this, 200, 300, 'Continue', () => {
        enterMobileFullscreen(this);
        this.scene.resume(this.returnScene);
        this.scene.sleep();
      }));
    }
  }
}
