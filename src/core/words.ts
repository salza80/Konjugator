import { splitAnswer } from './answers';
import type { Word } from './types';

/** Keep falling prompts and answers short enough for a quick-response game. */
export const WORD_TEXT_LIMITS = { question: 40, answer: 24 } as const;

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
  return value.map((word, index) => {
    const parsed = {
      ...word,
      question: word.question.trim().replace(/\s+/g, ' ').normalize('NFC'),
      answer: word.answer.trim().replace(/\s+/g, ' ').normalize('NFC'),
    };
    for (const field of ['question', 'answer'] as const) {
      const length = [...parsed[field]].length;
      const limit = WORD_TEXT_LIMITS[field];
      if (length > limit) {
        throw new Error(`Word ${index + 1}: ${field} has ${length} characters; maximum is ${limit}. Use a shorter ${field}.`);
      }
    }
    return parsed;
  });
}

export function allCharacters(words: readonly Word[]): string[] {
  return [...new Set(words.flatMap((word) => splitAnswer(word.answer)))];
}

/** Distinct prompts sharing an answer must remain separate review items. */
export function wordKey(word: Word): string {
  return JSON.stringify([word.question, word.answer]);
}
