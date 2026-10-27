import { onSceneEnd } from '../platform/lifecycle';
import type Phaser from 'phaser';
import { gameAudio } from '../platform/audio';
import InputButton from './InputButton';

export default class SoundButton extends InputButton {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const audio = gameAudio(scene.game);
    super(scene, x, y, '', () => audio.toggle(), 18);
    const render = (): void => { this.setText(audio.enabled ? 'Sound: On' : 'Sound: Off'); };
    scene.sound.on('mute', render);
    onSceneEnd(scene, () => {
      scene.sound.off('mute', render);
    });
    render();
  }
}
