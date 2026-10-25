import type { WordKind } from './types';

export const WORD_VARIANTS = {
  falling: { color: '#de77ae', fontSize: 30, multiplier: 2, hitSound: 'smb_coin', targetChance: 8 / 11 },
  bonusfalling: { color: '#F21536', fontSize: 30, multiplier: 10, hitSound: 'smb_pipe', targetChance: 4 / 11 },
  bonus: { color: '#ffa500', fontSize: 20, multiplier: 40, hitSound: 'smb_powerup', targetChance: 0 },
} as const;

export interface Difficulty {
  fallingSpeed: number;
  bonusSpeed: number;
  fallingDelay: readonly [number, number];
  bonusDelay: readonly [number, number];
}

export function initialDifficulty(): Difficulty {
  return { fallingSpeed: 12, bonusSpeed: 38, fallingDelay: [6000, 18000], bonusDelay: [10000, 20000] };
}

export function nextDifficulty(current: Difficulty): Difficulty {
  const reduce = (range: readonly [number, number], percent: number, minimum: number): readonly [number, number] => {
    const from = Math.max(minimum, range[0] - Math.round(range[0] * percent));
    const to = Math.max(from + 1000, range[1] - Math.round(range[1] * percent));
    return [from, to];
  };
  return {
    fallingSpeed: current.fallingSpeed + 2,
    bonusSpeed: current.bonusSpeed + 2,
    fallingDelay: reduce(current.fallingDelay, 0.1, 500),
    bonusDelay: reduce(current.bonusDelay, 0.05, 1000),
  };
}

export function scoreFor(answer: string, kind: WordKind, level: number): number {
  const base = answer.length * WORD_VARIANTS[kind].multiplier;
  return base + Math.round(base * level / 10);
}

export function blockPositions(count: number, bounds: { left: number; width: number; bottom: number }, size: number, random: () => number): { x: number; y: number }[] {
  const rows: number[][] = [];
  const columns = Math.floor(bounds.width / size);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(random() * columns) * size + size / 2 + bounds.left;
    const row = rows.find((entry) => !entry.includes(x));
    if (row) row.push(x);
    else rows.push([x]);
  }
  return rows.flatMap((row, index) => row.map((x) => ({ x, y: bounds.bottom - size / 2 - index * (size + 1) })));
}
