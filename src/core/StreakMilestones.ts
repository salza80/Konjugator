export const STREAK_MILESTONES = [5, 10, 20] as const;

/** Each milestone is awarded once per session, even after a streak resets. */
export default class StreakMilestones {
  private readonly claimed = new Set<number>();

  claim(streak: number): number | undefined {
    const milestone = STREAK_MILESTONES.find((value) => streak >= value && !this.claimed.has(value));
    if (milestone !== undefined) this.claimed.add(milestone);
    return milestone;
  }
}
