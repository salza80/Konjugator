/** Opt-in session lengths; existing embeds retain the survival defaults. */
export const SESSION_PRESETS = {
  quick: { roundGoal: 15, health: 12 },
  survival: { roundGoal: 0, health: 60 },
} as const;

export type SessionPreset = keyof typeof SESSION_PRESETS;
