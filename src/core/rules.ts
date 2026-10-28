import type { WordKind } from './types';

export const WORD_VARIANTS = {
  falling: { color: '#de77ae', fontSize: 30, bonusPoints: 0, damage: 1, hitSound: 'smb_coin', targetChance: 8 / 11 },
  bonusfalling: { color: '#F21536', fontSize: 30, bonusPoints: 5, damage: 1, hitSound: 'smb_pipe', targetChance: 4 / 11 },
  bonus: { color: '#ffa500', fontSize: 20, bonusPoints: 10, damage: 0, hitSound: 'smb_powerup', targetChance: 0 },
} as const;

export const SCORING = { basePoints: 10, maxStreakBonus: 5 } as const;

export interface ScoreAward {
  base: number;
  targetBonus: number;
  streakBonus: number;
  total: number;
}

/** One award per accepted answer, even if it clears duplicate targets. */
export function scoreFor(kinds: readonly WordKind[], streak: number): ScoreAward {
  if (!kinds.length) return { base: 0, targetBonus: 0, streakBonus: 0, total: 0 };
  const base = SCORING.basePoints;
  const targetBonus = Math.max(...kinds.map((kind) => WORD_VARIANTS[kind].bonusPoints));
  const streakBonus = Math.min(SCORING.maxStreakBonus, Math.max(0, streak - 1));
  return { base, targetBonus, streakBonus, total: base + targetBonus + streakBonus };
}

interface BaseBounds { left: number; width: number; bottom: number }
interface BlockPosition { x: number; y: number }

export function blockPositions(count: number, bounds: BaseBounds, size: number, random: () => number): BlockPosition[] {
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

/** Fill an empty grid slot, starting near the centre; never overlap a live block. */
export function repairPosition(occupied: readonly BlockPosition[], bounds: BaseBounds, size: number): BlockPosition | undefined {
  const columns = Math.floor(bounds.width / size);
  if (columns < 1) return undefined;
  for (let index = 0; index <= occupied.length; index++) {
    const x = ((Math.floor(columns / 2) + index) % columns) * size + size / 2 + bounds.left;
    const y = bounds.bottom - size / 2 - Math.floor(index / columns) * (size + 1);
    if (!occupied.some((block) => block.x === x && block.y === y)) return { x, y };
  }
  return undefined;
}
