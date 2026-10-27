# Architecture

Konjugator is a browser game with a Phaser renderer and physics engine. All
maintained application code is TypeScript. `main.ts` exports the reusable game
entry point; `bootstrap.ts` is the standalone page/iframe adapter.

## Ownership and dependency direction

| Folder | Responsibility |
| --- | --- |
| `core/` | Word validation, answer transformations, progress, scoring, placement, difficulty and data contracts. No Phaser, DOM or browser APIs. |
| `game/` | Session state, level timing, collision consequences and spawn scheduling. Uses Phaser and coordinates input/UI. |
| `scenes/` | Composition, loading, navigation and scene lifecycle. Passes typed data between scenes. |
| `entities/` | Rendered words and blocks with physics, cosmetic shots and local effects. Receives word data; never reads the word cache. |
| `input/` | Keyboard, touch and voice adapters. Submit candidates through the same `SubmitAnswer` callback. |
| `ui/` | Display and controls. Never owns score, level progression or game rules. |
| `platform/` | Browser speech APIs, orientation and fullscreen behavior, with explicit cleanup. |
| `config.ts` | Game dimensions, shared colors, embedding configuration and playfield layout. |

`core` is independent. Other layers may use it. Scenes assemble the runtime;
input and entities do not import scenes or `GameSession`. Direct callbacks
express ownership without a global event bus.

## Game flow

1. `startGame(config)` normalizes public options and constructs a fresh Phaser
   game. Its registry holds only these initial options.
2. `BootScene` loads assets, validates word data and passes `ReadyData` to the
   title scene. Invalid data and load failures render a retry screen.
3. `TitleScene` selects an input mode and passes `PlayData` to `GameScene`.
4. `GameScene` creates the HUD, session and selected input adapter. Unsupported
   voice input falls back to keyboard before calculating the playfield.
5. `GameSession` coordinates physics, level timing, input, UI and phase:
   `countdown`, `playing`, or `over`. `SpawnController` owns word creation and
   spawn timers. Word variants share one entity and a configuration table. `core/pacing.ts`
   defines the five timed waves, bounded level scaling and special-target slots.
   The session's elapsed level time drives `SpawnController.advance`; the
   spawner has no independent repeating spawn clocks. It applies phase speed
   changes to existing falling targets, caps active words and skips blocked
   spawn slots without accumulating a backlog. A single cancellable refill
   timer provides a short breather after clearing the field. A special due
   during that breather replaces its normal refill; at most one special is
   deferred, and stopping spawns clears it with the timer.
   Normal levels stop all spawns and pending refills for their final 10 seconds.
   During this closing period the session advances as soon as all targets
   (including resolved feedback) are removed, skipping any unused closing time.
   A shared readiness check runs when closing begins and whenever a target is
   removed; it only advances a playing, active, non-practice session. The clock
   holds at zero if existing words still need to finish. Later levels use a
   two-second countdown without repeating instructions; the initial countdown
   stays five seconds. Both use the same pausable scene clock. The session enters
   countdown before clearing entities, so removal callbacks cannot advance it
   again. Practice has no level boundary.
6. Input submits an answer. The session normalizes and matches it, awards
   points immediately and resolves matching targets before launching cosmetic
   shots. Resolved targets cannot damage the base or score twice. The HUD shows
   the accepted answer and points when a correction is not being read; score
   and target effects always update immediately. Keyboard errors retain editable input.
   Input adapters do not decide scores or manipulate physics.
   Base health is the number of remaining blocks. Each missed falling word
   removes one health, including words passing through gaps; incorrect entries
   do not. The HUD renders this
   session-owned value as a count and bar, with a low-health label.
7. The session reports an internal `SessionResult` snapshot containing score,
   correct/incorrect attempts, missed-target count, best streak and deduplicated review words. `GameScene` passes it alongside
   options, validated words and the effective input mode in `ResultData`.
   `GameOverScene` shows accuracy (correct divided by all submitted attempts)
   and best streak alongside missed falling targets, separately skipped optional
   bonuses, and practice/round-goal completion
   progress. Missed-target events count once per escaped or base-hitting target,
   independently of deduplicated review items and submitted-answer accuracy.
   It invokes the unchanged `{ score }` embedding callback once
   per completed game. Play Again starts `GameScene` directly using the same
   data and input mode; a new `GameSession` resets all per-game statistics.
   Menu returns to the title scene. Practise My Mistakes passes a separate
   optional `practiceWords` subset, keeping `words` as the original dataset.
   Result-screen keyboard listeners are removed on shutdown. Missed targets
   and ignored input do not count as attempts.

`core/DifficultyController.ts` owns difficulty presets, input/answer-length
allowances and a bounded recent-performance adjustment. The spawner snapshots
the policy at level starts and wave boundaries, applying one consistent factor
to falling and horizontal movement. Empty input and optional bonus misses do
not influence adaptation. Practice always uses its gentle, single-word policy.

Scoring is calculated in `core/rules.ts`: 10 base points per accepted answer,
plus the highest matching target bonus (0/5/10) and a streak bonus of
`min(streak - 1, 5)`. One submission advances the streak once, even if it clears
multiple targets. Wrong reported attempts and missed falling targets reset it;
empty input, interim recognition, level transitions and pauses do not. Optional
orange targets can leave without penalty. Entities notify the session when a
falling word reaches the floor without hitting a block, so that path also resets
the streak. Both floor escapes and block collisions remove one health through
a shared, deduplicated session handler. Optional bonuses do neither; their
miss count is separate. HUD labels do not own rules.

`core/StreakMilestones.ts` awards thresholds 5, 10 and 20 once per session.
The session can restore one missing block for each award, capped at starting
health; `repairPosition` finds an empty grid slot independently of Phaser.
The HUD presents a pausable milestone message separately from correction text.

`core/SessionProgress.ts` owns scores, streaks, attempts, misses, review collection
and remaining practice items. `SessionMode` explicitly represents survival,
goal or practice; no boolean/goal combination can accidentally mix modes.
The session delegates accounting and immutable result snapshots to this model.
`wordKey` identifies question/answer pairs; entries retain the validated word
objects. Wrong touch choices supply their selected word. Wrong free-form
answers record visible candidates because no question is selected. Misses and
unanswered targets at game over enter review without adding accuracy attempts.
Orange escapes enter review without resetting streaks. Unassisted practice
answers remove words from the remaining map; assisted answers score but remain
for later recall. The session ends when progress reports completion.
When practice ends, remaining words are merged into the deduplicated review
snapshot, preserving unspawned items if the base is lost. This does not add
incorrect attempts or change the number of completed practice words.
The spawner's optional practice-word provider exposes only remaining items,
limits the field to one normal word and disables timed wave progression. Misses
schedule another attempt through the same cancellable field-refill timer.
Practice summaries stay internal; the host still receives only `{ score }`.

`core/ReviewQueue.ts` inserts targeted retries between fresh bag selections.
It spaces failures by three presentations where possible and at least 6.4
seconds after correction exposure, using session time accumulated only during
active scene updates. A tiny pool uses the time delay without requiring missing
intervening words. HUD correction-display callbacks mark help actually shown,
including queued corrections. Active duplicates cannot clear that assistance.
Only later unassisted answers clear review/practice entries; results separately
count assisted and unassisted submissions and distinct recovered words.
The spawner receives named callbacks/policies, maintains one cancellable refill
or recall-wait timer, and retains a deferred special through recall waits.

SessionProgress is the accounting source of truth; the session owns runtime coordination. HUD text is never read back as gameplay
state. Word selection happens in the spawner, using validated data supplied by
BootScene. Randomness is passed to pure selection/layout functions; engine
randomness stays at the runtime boundary.

`core/WordBag.ts` owns shuffled coverage and question/answer-pair identity for
selection. Each spawner keeps one bag across levels and target kinds; a fresh
session creates a fresh bag. Selection defers active pairs when alternatives
exist, leaving skipped entries in the current bag. Practice's shrinking pool
prunes completed items before selection. Shuffling never mutates host data.

`core/words.ts` validates every dataset before gameplay. `WORD_TEXT_LIMITS`
caps prompts at 40 characters and answers at 24, including spaces/punctuation.
Both fields are trimmed, whitespace-collapsed and NFC-normalized before counting
Unicode code points. Over-limit entries reject the dataset with an indexed field
error; inline data and loaded JSON share this path. Optional hints and voice
metadata retain their existing handling.

`ui/fitText.ts` owns bounded text layout: advanced wrapping breaks long tokens,
then font reduction and a final scale keep text within its display bounds.
Data validation keeps active prompts short; fitting also handles feedback and
hints. Targets fit questions before creating their physics
bodies. `core/targetLayout.ts` finds free vertical corridors from those measured
widths, trying the preferred position before nearby clear alternatives; the
spawner defers a bag item if no corridor fits. Bonus questions use a
separate top band. Target entities apply positions chosen by the spawner and
crop their text to the play area in both Canvas and WebGL; they never choose
random columns themselves. A shared play-area containment check
governs answer eligibility, touch selection and review attribution. Placement, floor detection, visibility checks and cosmetic shots use
display dimensions, including when text is scaled. Resolved answers and hints,
answer entry and HUD feedback use the same fitting helper with separate bounds.

`ui/FeedbackBanner.ts` owns the HUD's status and correction rendering. A correction
has a question line and a separately styled answer line. A bounded, deduplicated
queue handles bursts of misses; ordinary success messages cannot replace a
correction before its reading time finishes. System notices may interrupt and
then return to it. The scene clock pauses both the banner and resolved-target
timers. Success targets remain for 1.5 seconds; missed targets (including escaped
bonuses) show question, answer and optional hint for 3.2 seconds. Local labels
stay within their original word lanes so simultaneous misses do not expand
across neighbouring labels. HUD corrections give the full labelled answer and
survive later-level countdowns without extending them. Misses immediately clear
touch selection; they do not change the existing accounting rules.

The session supplies the known touch question or a single distinct visible
candidate for wrong-answer corrections; ambiguous free-form input never picks
an arbitrary answer. `GameScene` passes the HUD's last correction in internal
`ResultData`, independently of `SessionProgress`, so the results screen can retain
the final correction after scene shutdown. Public configuration, `SessionResult`
accounting and the `{ score }` callback are unchanged.

`ui/TouchChoicePanel.ts` owns touch-choice layout and paging in 192-unit side
panels. It reuses six 168×104 tiles rather than allocating one text button per
character in the dataset. `TouchButton` separates its fixed hit rectangle from
its fitted label, provides pressed feedback and requires a press/release on the
same tile. Up to six choices appear per page; 88-unit navigation buttons expose
remaining choices without reducing tile sizes. `TouchInput` owns selection and
partial answers, so paging never changes scoring or progress. Retapping the
selected question leaves progress intact. Word hit areas extend halfway into
the shared layout gap without changing physics bodies or answer eligibility.

## Lifecycle

- Phaser owns display objects, physics groups, colliders and scene clocks.
- Entities release their own transient timers/listeners when destroyed.
- The spawner cancels its pending field-refill timer at level boundaries and
  shutdown. Session-clock pause/resume preserves wave timing without catch-up
  bursts. Level transitions reset the wave schedule; replay resets level scaling.
- `platform/lifecycle.ts` runs scene cleanup once on either shutdown or destruction.
  The scene disposes the session and input adapter on shutdown. Disposal does
  not clear groups that Phaser may already have destroyed.
- Pausing for orientation or blurring the game cancels browser recognition and
  speech playback. Resuming never silently reopens the microphone: press Talk.
- `GameScene` owns pause requests from its Pause button, Escape, window blur,
  game-owned editor/canvas focus loss and page hiding. It pauses the Phaser scene and launches
  `PauseScene` above it, freezing physics, tweens and scene timers together.
  Repeated requests are coalesced. Only an explicit Continue action or Enter/Space/Escape resumes
  gameplay; focus restoration alone does not. The overlay observes orientation
  and requires landscape on mobile before continuing. Title-screen orientation
  handling remains in `OrientationScene`. Pause listeners and the overlay are
  cleaned up with the game scene, including when the host destroys the game.
- Each recognition attempt has a generation identifier. Results from a
  cancelled attempt cannot affect a later attempt. Exact interim matches can
  shoot early, final alternatives remain supported, and each attempt fires once.
- Speech recognition is isolated from Phaser. Browser-specific types are kept
  inside the adapter rather than using `any` throughout input/gameplay code.
- `platform/audio.ts` keeps per-game output controls in a WeakMap keyed by the
  Phaser game, using its sound-manager mute state for effects and spoken answers.
  `SoundButton` shares that state across scenes and removes its listeners on
  shutdown/destruction. Muting cancels active speech; session pause/disposal
  also cancels speech. The controller releases speech/listeners on game destroy.
  `platform/SpeechPlayback.ts` owns output separately from recognition. Its
  coordinator shared across accessible same-origin ancestor windows gives host
  speech priority and serializes games. It wraps each host Window's current
  speak method while clients exist, stopping
  game output before host speech starts, and restores it when unused.
  Spoken answers use a private hidden-frame Window speech queue per game,
  with ownership cleared on end/error and the frame removed on destruction.
  Cancelling game speech never calls the host Window's speech cancel method.
  Voice recognition remains independent of output muting. Sound preferences
  belong to each game and are not persisted to browser storage.

Keyboard editing uses a native, visually transparent input aligned with the
canvas answer area; the Phaser label displays its full value. This supports
Unicode composition, paste and normal editing. `platform/keyboard.ts` registers
game-owned editors and scopes shortcuts to focused game elements. Focus loss
pauses play; paused editors are disabled and re-enabled only on resume.
Voice errors expose a keyboard fallback without restarting the session. The
input adapter is replaced and the effective mode is retained for replay.

## Configuration and distribution

The public `GameConfig` keeps existing snake_case embedding options. Internal
code uses normalized `GameOptions`. Scene handoffs use explicit interfaces;
mutable gameplay state does not live in the Phaser registry.

Optional `round_goal` normalizes to a positive safe integer (zero internally
means survival mode). `core/sessionPresets.ts` defines opt-in quick sessions
(15 answers, 12 health) and compatible survival defaults (no goal, 60 health).
The standalone adapter and embed example opt into quick sessions; existing
hosts retain survival. An explicit positive goal overrides the preset goal.
The session counts correct submissions toward this goal
and ends successfully when it is reached; matching duplicate targets count once.
Success clears leftover targets without recording them as mistakes. Internal
results include the goal and completion flag for the HUD/results screen; the
public callback stays `{ score }`. Practice ignores the goal and uses its own
remaining-word completion rule. Replay retains configuration and resets progress.

`npm run build` checks types and builds the standalone site plus an ES module
library with declarations. The site bundles Phaser; the library imports it
from the package's runtime dependency. TypeScript, Vite, Vitest and ESLint are
development tools. Node is only needed for development/building.
The project is private and cannot be published with `npm publish`. Library
output supports local embedding; there is no package publishing configuration.

`public/` contains maintained static files; `dist/` is generated and ignored.
There is no automated deployment workflow. CI validates without deploying.
The historical tracked `docs/` build has been removed;
generated site output belongs only in `dist/`. Unused source implementations,
plugins, music and sprite sheets have been removed from the maintained tree.

## Verification

Use `npm run check` to run lint, type checking and both builds, as CI does.
Browser and tooling types are checked separately using `tsconfig.json` and
`tsconfig.node.json`. No automated test
suite has been added yet. Future tests should exercise the pure core directly
and cover browser integration with a small set of gameplay flows. Avoid
recreating Phaser in mocks merely to test scoring or answer rules.
