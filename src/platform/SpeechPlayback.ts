interface SpeechClient { cancel(): void }
const coordinatorKey = Symbol.for('konjugator.speechCoordinator');
type SpeechHost = Window & { [coordinatorKey]?: SpeechCoordinator };

function hostWindows(): Window[] {
  const windows: Window[] = [window];
  let current: Window = window;
  while (current.parent !== current) {
    try {
      const parent = current.parent;
      // Cross-origin parents cannot participate in an in-process speech broker.
      void parent.document;
      windows.push(parent);
      current = parent;
    } catch { break; }
  }
  return windows;
}

/** Shared by direct embeds and same-origin frames; host speech has priority. */
class SpeechCoordinator {
  private readonly clients = new Map<SpeechClient, readonly SpeechSynthesis[]>();
  private readonly hosts = new Map<SpeechSynthesis, {
    original: SpeechSynthesis['speak']; wrapper: SpeechSynthesis['speak']; users: number;
  }>();

  constructor(private readonly owner: SpeechHost) {}

  register(client: SpeechClient, windows: readonly Window[]): void {
    const syntheses = [...new Set(windows.map((host) => host.speechSynthesis).filter(Boolean))];
    this.clients.set(client, syntheses);
    for (const synthesis of syntheses) {
      const existing = this.hosts.get(synthesis);
      if (existing) { existing.users++; continue; }
      const original = synthesis.speak;
      const wrapper = (utterance: SpeechSynthesisUtterance): void => {
        // Stop games BEFORE host speech enters the shared browser audio backend.
        for (const game of this.clients.keys()) game.cancel();
        original.call(synthesis, utterance);
      };
      synthesis.speak = wrapper;
      this.hosts.set(synthesis, { original, wrapper, users: 1 });
    }
  }

  claim(client: SpeechClient): boolean {
    for (const synthesis of this.hosts.keys()) {
      if (synthesis.speaking || synthesis.pending) return false;
    }
    for (const other of this.clients.keys()) if (other !== client) other.cancel();
    return true;
  }

  release(client: SpeechClient): void {
    for (const synthesis of this.clients.get(client) ?? []) {
      const host = this.hosts.get(synthesis);
      if (!host || --host.users) continue;
      if (synthesis.speak === host.wrapper) synthesis.speak = host.original;
      this.hosts.delete(synthesis);
    }
    this.clients.delete(client);
    if (!this.clients.size && this.owner[coordinatorKey] === this) delete this.owner[coordinatorKey];
  }
}

/** Each game owns a separate Window speech queue, including cancellation. */
type PlaybackContext = Window & { SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance };

export class SpeechPlayback {
  private coordinator?: SpeechCoordinator;
  private utterance?: SpeechSynthesisUtterance;
  private frame?: HTMLIFrameElement;
  private context?: PlaybackContext;

  say(text: string): void {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    if (!this.coordinator) {
      const windows = hostWindows();
      const owner = (windows[windows.length - 1] ?? window) as SpeechHost;
      owner[coordinatorKey] ??= new SpeechCoordinator(owner);
      this.coordinator = owner[coordinatorKey];
      this.coordinator.register(this, windows);
    }
    if (!this.coordinator.claim(this)) return;
    if (!this.context) {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      const frame = document.createElement('iframe');
      frame.hidden = true;
      frame.tabIndex = -1;
      frame.title = 'Game speech output';
      frame.setAttribute('aria-hidden', 'true');
      document.body.append(frame);
      this.frame = frame;
      this.context = (frame.contentWindow as PlaybackContext | null) ?? undefined;
    }
    const context = this.context;
    if (!context?.speechSynthesis || !context.SpeechSynthesisUtterance || this.utterance) return;
    const utterance = new context.SpeechSynthesisUtterance(text);
    this.utterance = utterance;
    utterance.lang = 'de-DE';
    const release = (): void => { if (this.utterance === utterance) this.utterance = undefined; };
    utterance.onend = release;
    utterance.onerror = release;
    context.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    const utterance = this.utterance;
    this.utterance = undefined;
    if (utterance) {
      utterance.onend = null;
      utterance.onerror = null;
      this.context?.speechSynthesis.cancel();
    }
  }

  dispose(): void {
    this.cancel();
    this.frame?.remove();
    this.frame = undefined;
    this.context = undefined;
    this.coordinator?.release(this);
    this.coordinator = undefined;
  }
}
