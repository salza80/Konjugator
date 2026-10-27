import { scoreFor } from './rules';
import type { ScoreAward } from './rules';
import type { SessionMode, SessionResult, Word, WordKind } from './types';
import { wordKey } from './words';
import ReviewQueue from './ReviewQueue';
import StreakMilestones from './StreakMilestones';

interface AnswerAward extends ScoreAward { assisted: boolean; recovered: number; milestone?: number }

/** Gameplay accounting, independent of rendering, clocks and browser APIs. */
export default class SessionProgress {
  score = 0;
  streak = 0;
  bestStreak = 0;
  correctAnswers = 0;
  incorrectAnswers = 0;
  unassistedAnswers = 0;
  assistedAnswers = 0;
  private readonly recovered = new Set<string>();
  missedWords = 0;
  readonly review = new ReviewQueue();
  private readonly milestones = new StreakMilestones();
  private readonly mistakes = new Map<string, Word>();
  private readonly remaining = new Map<string, Word>();
  readonly practiceTotal: number;

  constructor(readonly mode: SessionMode) {
    if (mode.kind === 'practice') {
      for (const word of mode.words) this.remaining.set(wordKey(word), word);
    }
    this.practiceTotal = this.remaining.size;
  }

  get remainingWords(): readonly Word[] { return [...this.remaining.values()]; }
  get recoveredWords(): number { return this.recovered.size; }
  get practiceCompleted(): number { return this.practiceTotal - this.remaining.size; }
  get roundGoal(): number { return this.mode.kind === 'goal' ? this.mode.target : 0; }
  get roundCompleted(): boolean { return this.roundGoal > 0 && this.correctAnswers >= this.roundGoal; }
  get completed(): boolean {
    return this.mode.kind === 'practice' ? this.remaining.size === 0 : this.roundCompleted;
  }

  accept(targets: readonly { word: Word; kind: WordKind }[], now: number): AnswerAward {
    if (!targets.length) return { ...scoreFor([], this.streak), assisted: false, recovered: 0 };
    this.correctAnswers++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const award = scoreFor(targets.map((target) => target.kind), this.streak);
    this.score += award.total;
    const learning = this.review.accept(targets.map((target) => target.word), now);
    if (learning.assisted) this.assistedAnswers++;
    else this.unassistedAnswers++;
    let recovered = 0;
    for (const word of learning.clean) {
      const key = wordKey(word);
      const practiceRecall = this.remaining.delete(key);
      if (practiceRecall || learning.recovered.some((item) => wordKey(item) === key)) {
        this.recovered.add(key);
        recovered++;
      }
      this.mistakes.delete(key);
    }
    return { ...award, assisted: learning.assisted, recovered, milestone: this.milestones.claim(this.streak) };
  }

  reject(words: readonly Word[], now: number): boolean {
    this.incorrectAnswers++;
    this.remember(words);
    this.review.fail(words, now);
    return this.resetStreak();
  }

  miss(word: Word, kind: WordKind, now: number): boolean {
    this.missedWords++;
    this.remember([word]);
    this.review.fail([word], now);
    return kind === 'bonus' ? false : this.resetStreak();
  }

  remember(words: readonly Word[]): void {
    for (const word of words) this.mistakes.set(wordKey(word), word);
  }

  private resetStreak(): boolean {
    const reset = this.streak > 0;
    this.streak = 0;
    return reset;
  }

  result(): SessionResult {
    // An interrupted practice must retain even items that have never appeared.
    const review = new Map(this.mistakes);
    for (const word of this.review.words) review.set(wordKey(word), word);
    for (const [key, word] of this.remaining) review.set(key, word);
    return {
      score: this.score, correctAnswers: this.correctAnswers,
      incorrectAnswers: this.incorrectAnswers, missedWords: this.missedWords,
      unassistedAnswers: this.unassistedAnswers, assistedAnswers: this.assistedAnswers,
      recoveredWords: this.recoveredWords,
      bestStreak: this.bestStreak, mistakes: [...review.values()],
      practiceTotal: this.practiceTotal, practiceCompleted: this.practiceCompleted,
      roundGoal: this.roundGoal, roundCompleted: this.roundCompleted,
    };
  }
}
