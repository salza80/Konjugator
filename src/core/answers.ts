export function normalizeAnswer(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function compactAnswer(text: string): string {
  return text.replace(/\s/g, '');
}

export function splitAnswer(text: string): string[] {
  return compactAnswer(text).match(/.{1,2}/gu) ?? [];
}

/** Map entered character groups back to the original spacing of an answer. */
export function touchProgress(answer: string, input: string): string | null {
  const compact = compactAnswer(input);
  if (!compactAnswer(answer).startsWith(compact)) return null;
  let count = 0;
  let end = 0;
  while (end < answer.length && count < compact.length) {
    if (!/\s/.test(answer.charAt(end))) count++;
    end++;
  }
  while (end < answer.length && /\s/.test(answer.charAt(end))) end++;
  return answer.slice(0, end);
}

export function characterChoices(answer: string, all: readonly string[], shuffle: (items: string[]) => string[]): string[] {
  const required = [...new Set(splitAnswer(answer))];
  const distractors = shuffle(all.filter((char) => !required.includes(char)));
  return shuffle([...required, ...distractors.slice(0, Math.max(0, 6 - required.length))]);
}
