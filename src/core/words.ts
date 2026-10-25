import { splitAnswer } from './answers';
import type { Word } from './types';

function isWord(value: unknown): value is Word {
  if (typeof value !== 'object' || value === null) return false;
  const word = value as Record<string, unknown>;
  return typeof word.question === 'string' && !!word.question.trim()
    && typeof word.answer === 'string' && !!word.answer.trim()
    && (word.tip === undefined || typeof word.tip === 'string')
    && (word.voice === undefined || typeof word.voice === 'string');
}

export function parseWords(value: unknown): Word[] {
  if (!Array.isArray(value) || !value.length || !value.every(isWord)) {
    throw new Error('Word data must be a non-empty array with question and answer strings. Tip and voice are optional strings.');
  }
  return value.map((word) => ({
    ...word,
    question: word.question.trim().normalize('NFC'),
    answer: word.answer.trim().replace(/\s+/g, ' ').normalize('NFC'),
  }));
}

export function allCharacters(words: readonly Word[]): string[] {
  return [...new Set(words.flatMap((word) => splitAnswer(word.answer)))];
}

export function chooseWord(words: readonly Word[], random: () => number): Word {
  const word = words[Math.floor(random() * words.length)];
  if (!word) throw new Error('Cannot choose a word from empty word data.');
  return word;
}
