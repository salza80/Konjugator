import type { Bounds } from './types';

export interface Rectangle { x: number; y: number; width: number; height: number }

export const TARGET_LAYOUT = { gap: 16, bonusHeight: 80, maxWidth: 520 } as const;

export function contains(bounds: Bounds, rect: Rectangle): boolean {
  return rect.x >= bounds.left && rect.y >= bounds.top
    && rect.x + rect.width <= bounds.right && rect.y + rect.height <= bounds.bottom;
}

/** A free vertical corridor prevents faster falling questions overtaking others. */
export function freeColumn(width: number, bounds: Bounds, occupied: readonly Rectangle[], preferred: number): number | undefined {
  if (width > bounds.right - bounds.left) return undefined;
  const clamp = (x: number): number => Math.max(bounds.left, Math.min(x, bounds.right - width));
  const candidates = [preferred, bounds.left, bounds.right - width,
    ...occupied.flatMap((rect) => [rect.x + rect.width + TARGET_LAYOUT.gap, rect.x - width - TARGET_LAYOUT.gap])]
    .map(clamp).sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
  return candidates.find((x) => occupied.every((rect) =>
    x + width + TARGET_LAYOUT.gap <= rect.x || x >= rect.x + rect.width + TARGET_LAYOUT.gap));
}
