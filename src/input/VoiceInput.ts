import type Phaser from 'phaser';
import { GAME } from '../config';
import type { SubmitAnswer } from '../core/types';
import { SpeechRecognitionAdapter } from '../platform/speech';
import type { SpeechResult, RecognitionStatus } from '../platform/speech';
import AnswerEntry from '../ui/AnswerEntry';
import InputButton from '../ui/InputButton';
import { fitText } from '../ui/fitText';
import type { PlayerInput } from './types';

const LABELS: Record<RecognitionStatus, string> = {
  idle: 'Talk', listening: 'Listening…', stopping: 'Stopping…', blocked: 'Microphone blocked', error: 'Try again',
};

export default class VoiceInput implements PlayerInput {
  readonly recognition: SpeechRecognitionAdapter;
  private readonly entry: AnswerEntry;
  private readonly button: InputButton;
  private shot = false;
  private readonly fallback: InputButton;

  constructor(private readonly scene: Phaser.Scene, private readonly submit: SubmitAnswer, onKeyboard: () => void) {
    this.entry = new AnswerEntry(scene, false);
    this.recognition = new SpeechRecognitionAdapter((result) => this.onResult(result), (status) => {
      if (!this.button.scene) return;
      this.button.setText(LABELS[status]);
      fitText(this.button, 360, 40, 32);
      this.fallback.setVisible(status === 'blocked' || status === 'error');
    });
    this.button = new InputButton(scene, GAME.width / 2 - 100, GAME.height - 55, 'Talk', () => {
      if (this.recognition.listening) return;
      this.shot = false;
      this.recognition.start();
    }, 32).setOrigin(0.5, 0).setDepth(2);
    this.fallback = new InputButton(scene, GAME.width / 2 + 230, GAME.height - 55, 'Use keyboard', onKeyboard, 24)
      .setOrigin(0.5, 0).setDepth(2).setVisible(false);
  }

  private onResult(result: SpeechResult): void {
    if (this.shot || !this.scene.scene.isActive()) return;
    const first = result.alternatives[0];
    if (!first) return;
    this.entry.set(first);
    const alternatives = result.final ? result.alternatives : [first];
    for (const answer of alternatives) {
      if (this.submit(answer, false)) {
        this.shot = true;
        this.entry.set(answer);
        this.recognition.stop();
        return;
      }
    }
    if (result.final) this.submit(first);
  }

  clear(): void {
    this.recognition.cancel();
    this.shot = false;
    this.entry.set('');
  }

  pause(): void { this.recognition.cancel(); }
  dispose(): void {
    this.recognition.cancel();
    this.entry.destroy();
    this.button.destroy();
    this.fallback.destroy();
  }
}
