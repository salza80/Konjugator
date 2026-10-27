import type Phaser from 'phaser';
import { SpeechPlayback } from './SpeechPlayback';

const instances = new WeakMap<Phaser.Game, GameAudio>();

/** Per-game output controls; microphone recognition remains independent. */
export class GameAudio {
  private readonly speech = new SpeechPlayback();
  private muted: boolean;

  constructor(private readonly game: Phaser.Game) {
    this.muted = game.sound.mute;
    const onMute = (_manager: unknown, muted: boolean): void => {
      // The Web Audio gain getter can lag behind its synchronous mute event.
      this.muted = muted;
      if (muted) this.cancelSpeech();
    };
    game.sound.on('mute', onMute);
    game.events.once('destroy', () => {
      game.sound.off('mute', onMute);
      this.speech.dispose();
      instances.delete(game);
    });
  }

  get enabled(): boolean { return !this.muted; }

  toggle(): void {
    const muted = this.enabled;
    this.game.sound.setMute(muted);
    // Phaser's no-audio manager has a no-op setter; speech still needs muting.
    if (this.muted !== muted) {
      this.game.sound.mute = muted;
      this.game.sound.emit('mute', this.game.sound, muted);
    }
  }

  say(text: string): void { if (this.enabled) this.speech.say(text); }

  cancelSpeech(): void { this.speech.cancel(); }
}

export function gameAudio(game: Phaser.Game): GameAudio {
  let audio = instances.get(game);
  if (!audio) {
    audio = new GameAudio(game);
    instances.set(game, audio);
  }
  return audio;
}
