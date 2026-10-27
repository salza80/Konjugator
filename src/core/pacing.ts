import type { WordKind } from './types';

/** Starts are seconds into each 90-second level. Recovery slows existing words too. */
export const WAVES = [
  { start: 0, label: 'Warm-up', interval: 7, speed: 12, maxTargets: 2 },
  { start: 18, label: 'Build', interval: 5, speed: 18, maxTargets: 3 },
  { start: 38, label: 'Breathe', interval: 9, speed: 12, maxTargets: 2 },
  { start: 50, label: 'Push', interval: 4, speed: 22, maxTargets: 4 },
  { start: 72, label: 'Recover', interval: 9, speed: 12, maxTargets: 2 },
] as const;

export const SPECIAL_TARGETS: readonly { at: number; kind: WordKind }[] = [
  { at: 28, kind: 'bonusfalling' },
  { at: 42, kind: 'bonus' },
  { at: 60, kind: 'bonusfalling' },
  { at: 78, kind: 'bonus' },
];

export function pacingFor(level: number, elapsed: number) {
  let index = 0;
  let wave: typeof WAVES[number] = WAVES[0];
  for (const [i, candidate] of WAVES.entries()) {
    if (elapsed >= candidate.start) {
      index = i;
      wave = candidate;
    }
  }
  // Six small increases, then hold steady instead of becoming impossible.
  const progression = Math.min(6, Math.max(0, level - 1));
  return {
    index,
    label: wave.label,
    interval: Math.max(2, wave.interval - Math.floor(progression / 2)),
    fallingSpeed: wave.speed + progression * 2,
    maxTargets: Math.min(6, wave.maxTargets + Math.floor(progression / 3)),
  };
}

export type WavePacing = ReturnType<typeof pacingFor>;
