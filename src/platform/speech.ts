export type RecognitionStatus = 'idle' | 'listening' | 'stopping' | 'blocked' | 'error';
export interface SpeechResult {
  alternatives: readonly string[];
  final: boolean;
}
interface NativeResult extends ArrayLike<{ transcript: string }> {
  isFinal: boolean;
}
interface NativeRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { resultIndex: number; results: ArrayLike<NativeResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => NativeRecognition;
  webkitSpeechRecognition?: new () => NativeRecognition;
};

export function supportsSpeechRecognition(): boolean {
  const browser = window as SpeechWindow;
  return !!(browser.SpeechRecognition ?? browser.webkitSpeechRecognition);
}

/** Browser API boundary. A fresh generation prevents results from a cancelled session leaking into the next. */
export class SpeechRecognitionAdapter {
  private readonly constructorType;
  private recognition?: NativeRecognition;
  private generation = 0;
  private running = false;
  private stopping = false;
  private status: RecognitionStatus = 'idle';

  constructor(private readonly onResult: (result: SpeechResult) => void, private readonly onStatus: (status: RecognitionStatus) => void) {
    const browser = window as SpeechWindow;
    this.constructorType = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  }

  get available(): boolean {
    return !!this.constructorType;
  }

  get listening(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running || !this.constructorType) return;
    this.stopping = false;
    const recognition = new this.constructorType();
    const generation = ++this.generation;
    this.recognition = recognition;
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.onresult = (event) => {
      if (generation !== this.generation || !this.running) return;
      const results = Array.from(event.results);
      for (let index = event.resultIndex; index < results.length; index++) {
        const result = results[index];
        if (!result?.length) continue;
        const prefix = results.slice(0, index).map((part) => part[0]?.transcript ?? '').join(' ');
        this.onResult({
          alternatives: Array.from(result).map((alternative) => `${prefix} ${alternative.transcript}`.trim()),
          final: result.isFinal,
        });
      }
    };
    recognition.onerror = ({ error }) => {
      if (generation !== this.generation) return;
      this.setStatus(error === 'not-allowed' || error === 'service-not-allowed' ? 'blocked' : 'error');
    };
    recognition.onend = () => {
      if (generation !== this.generation) return;
      this.running = false;
      if (this.status !== 'blocked' && this.status !== 'error') this.setStatus('idle');
    };
    recognition.onspeechend = () => {
      if (generation === this.generation) this.stop();
    };
    try {
      this.running = true;
      this.setStatus('listening');
      recognition.start();
    } catch {
      this.running = false;
      this.setStatus('error');
    }
  }

  stop(): void {
    if (!this.running || this.stopping) return;
    this.stopping = true;
    this.setStatus('stopping');
    this.recognition?.stop();
  }

  cancel(): void {
    this.generation++;
    this.running = false;
    this.stopping = false;
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.onspeechend = null;
      this.recognition.abort();
      this.recognition = undefined;
    }
    this.setStatus('idle');
  }

  private setStatus(status: RecognitionStatus): void {
    this.status = status;
    this.onStatus(status);
  }
}
