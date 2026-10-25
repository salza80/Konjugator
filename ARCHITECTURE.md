# Architecture

Konjugator is a browser game with a Phaser renderer and physics engine. All
maintained application code is TypeScript. `main.ts` exports the reusable game
entry point; `bootstrap.ts` is the standalone page/iframe adapter.

## Ownership and dependency direction

| Folder | Responsibility |
| --- | --- |
| `core/` | Word validation, answer transformations, scoring, difficulty and data contracts. No Phaser, DOM or browser APIs. |
| `game/` | Session state, level timing, collision consequences and spawn scheduling. Uses Phaser and coordinates input/UI. |
| `scenes/` | Composition, loading, navigation and scene lifecycle. Passes typed data between scenes. |
| `entities/` | Rendered words, bullets and blocks, including their physics and local effects. Receives word data; never reads the word cache. |
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
5. `GameSession` owns score, level, remaining time, difficulty and phase:
   `countdown`, `playing`, or `over`. `SpawnController` owns word creation and
   spawn timers. Word variants share one entity and a configuration table.
6. Input submits an answer. The session normalizes and matches it, launches
   bullets, awards points on collision and updates the HUD. Input adapters do
   not decide scores or manipulate physics.
7. The session reports the final score to `GameScene`, which passes `ResultData`
   to `GameOverScene`. That scene invokes the embedding callback once and
   offers a return to the title scene.

The session is the source of truth. HUD text is never read back as gameplay
state. Word selection happens in the spawner, using validated data supplied by
BootScene. Randomness is passed to pure selection/layout functions; engine
randomness stays at the runtime boundary.

## Lifecycle

- Phaser owns display objects, physics groups, colliders and scene clocks.
- Entities release their own transient timers/listeners when destroyed.
- The spawner tracks and cancels its own pending timers at level boundaries.
- The scene disposes the session and input adapter on shutdown. Disposal does
  not clear groups that Phaser may already have destroyed.
- Pausing for orientation or blurring the game cancels browser recognition and
  speech playback. Resuming never silently reopens the microphone: press Talk.
- Each recognition attempt has a generation identifier. Results from a
  cancelled attempt cannot affect a later attempt. Exact interim matches can
  shoot early, final alternatives remain supported, and each attempt fires once.
- Speech recognition is isolated from Phaser. Browser-specific types are kept
  inside the adapter rather than using `any` throughout input/gameplay code.

## Configuration and distribution

The public `GameConfig` keeps existing snake_case embedding options. Internal
code uses normalized `GameOptions`. Scene handoffs use explicit interfaces;
mutable gameplay state does not live in the Phaser registry.

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
