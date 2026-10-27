# Konjugator

A falling-text German conjugation game built with TypeScript, Phaser 4 and Vite.
See [ARCHITECTURE.md](./ARCHITECTURE.md) for module ownership and lifecycle rules.

## Development

Use Node.js 24.22.1 LTS, pinned in `.nvmrc`:

```sh
nvm use
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).
Static files live in `public/`; game assets are served at `assets/`.

## Commands

- `npm run dev`: development server with page reloads when source changes.
- `npm run check`: lint, type-check, and build the site and typed library.
- `npm run typecheck`: strict TypeScript checking, without emitting files.
- `npm run lint`: TypeScript-aware ESLint correctness checks.
- `npm run build`: type-check, build the site and generate the typed library.
- `npm run build:lib`: build the library and its declarations only.
- `npm run preview`: serve the built site locally.
- `npm test` / `npm run test:watch`: Vitest commands reserved for the later test suite.

No tests have been added yet. Vitest explicitly allows an empty suite.
The site build may warn about the size of the Phaser bundle.

GitHub Actions runs `npm ci` and `npm run check` on pushes and pull requests,
using the Node version in `.nvmrc`. Tests are not part of this workflow yet.
Browser source uses `tsconfig.json`; Vite configuration uses
`tsconfig.node.json` so Node globals are not exposed to game code.

The project is marked `private` to prevent npm/GitHub Packages publishing.
The library build remains available for local embedding; there is no package
publishing configuration or packaging lifecycle hook.

## Deployment

Publish `dist/` to a static host. A relative Vite base supports subdirectories.
Node and installed packages are not needed on the static host.

There is no automated deployment workflow. To deploy manually:

1. Run `nvm use` and `npm run check`.
2. Run `npm run preview` to inspect the production build locally.
3. Upload the contents of `dist/` to your static host's site root.

The old tracked `docs/` build has been removed. Keep generated output in
`dist/`; do not commit it. GitHub Pages is configured to use GitHub Actions,
but a deployment workflow would need to be added to publish there again.

## Embedding

The standalone page starts from `src/bootstrap.ts`. A same-origin parent can
provide `window.gameConfig`; see the working example at `/embed.html`
(`public/embed.html`). Cross-origin frames use default configuration.

For local source integration, `src/main.ts` exports a typed `startGame` API:

```ts
import { startGame, type GameConfig } from './src/main';

const config: GameConfig = {
  start_text: 'Konjugiere das Verb! Bist du bereit?',
  asset_path: 'assets/',
  input_type: 'Keyboard',
  round_goal: 10, // Optional: finish after 10 correct answers.
  game_over_callback: ({ score }) => console.log(score),
};

const game = startGame(config);
// When the embedding application unmounts:
// game.destroy(true);
```

For local source imports, use `./src/main`. `npm run build` produces the ES
module at `dist/lib/konjugator.js` and declarations at `dist/lib/types/`.
The library expects a bundler that resolves its Phaser dependency. Copy the
package's `public/assets/` contents to the configured asset path when embedding.
The default parent element is `content`; a `parent` ID or HTMLElement can be
supplied for another container.

Optional configuration includes `words` (question/answer objects, with optional
`tip` and `voice` strings), `words_url`, `start_text`, `input_type`, and
`game_over_callback`. Word arrays must be non-empty. Word URLs resolve relative
to the game document, independently of `asset_path`. Loading and validation
failures show a retry screen.

Set `round_goal` to a positive integer to finish a normal round successfully
after that many correct submitted answers. The HUD shows progress and the
results screen displays Round Complete when the goal is reached. One submission
counts once, even when it clears matching targets. Wrong answers and misses do
not subtract progress; losing the base still ends the round early. Omit the
option for the existing survival mode; invalid values also use survival mode.
Play Again retains the goal and starts fresh. Practice always finishes by
completing its review list, independently of the round goal. Reaching the goal
does not mark other active questions as mistakes. The callback still receives
only `{ score }`, once per completed round or practice session.

Keep each item short: questions allow up to **40 characters**, and answers up
to **24 characters**, including spaces and punctuation. Leading/trailing spaces
are removed, internal whitespace becomes a single space, and Unicode is
normalized to NFC before counting characters. Short phrases such as `steige ein`
are supported. These limits apply to both inline `words` and `words_url` data.
If any entry exceeds a limit, loading stops with an error naming its one-based
entry number, field, actual length and maximum; shorten that entry and reload.

Questions, answer feedback and optional hints still fit within the playfield.
Typed/touch answer text and HUD feedback are bounded to their display areas.
Touch character buttons fit their side-panel slots. The text-fitting helper
remains a layout safeguard; the data limits keep active questions readable and
quick to answer.

## Pacing

Each 90-second level follows five waves, shown in the HUD:

| Time into level | Wave | Level-one active-word limit |
| --- | --- | --- |
| 0–18 seconds | Warm-up | 2 |
| 18–38 seconds | Build | 3 |
| 38–50 seconds | Breathe | 2 |
| 50–72 seconds | Push | 4 |
| 72–90 seconds | Recover | 2 |

The opening has only normal words. Red targets are scheduled at 28 and 60
seconds; optional orange targets at 42 and 78 seconds. Specials are skipped
when the field is full, rather than queued into a later burst. Recovery slows
existing falling words and reduces new spawns; it does not remove questions.
Clearing every active word gives a 1.5-second breather before another appears.
If a special is due during that breather, it replaces the normal refill at the
end of the delay. Stopping spawns also cancels that deferred special.

Spawning stops for the final 10 seconds, including pending refill spawns.
During this closing period, remaining questions stay playable until answered or
missed, even past 90 seconds. Once the field and its answer feedback have cleared,
the next level starts with a short **two-second countdown**; an empty field skips
the unused closing time. Instructions appear only in the initial five-second
countdown. Level boundaries never count an unfinished word as a mistake.
Practice keeps its existing untimed flow and initial countdown. Pausing freezes
the shorter level countdown too.

Later levels gradually increase speed and capacity and shorten spawn intervals.
Progression stops increasing after level 7, with at most six active words and
at least two seconds between scheduled normal spawns. When a wave lowers the
limit, existing words stay and new spawns wait for room. Supplied word data and
plugin options are unchanged. Falling questions occupy separate vertical corridors;
spawning tries its preferred position first and falls back to a clear corridor,
waiting when there is no readable space. Orange targets use a separate
80-pixel band below the HUD, so crossing paths never obscure falling questions.
Targets appear fully within their play areas. Partly exited targets cannot be
answered or selected.

Word selection uses a shuffled bag of distinct question/answer pairs, shared by
normal and special targets. Every pair gets a turn before the bag refills, and
coverage carries across levels. Active duplicates and immediate repeats are
avoided when alternatives are available. If remaining bag entries are active,
spawning waits rather than repeating already-covered alternatives; tiny pools
can repeat when every available pair is already active. A new game gets a fresh
bag. Practice uses the same selection, drops completed words, and gives other
remaining items a turn before retrying a missed word. Supplied arrays and word
metadata are preserved.

## Scoring

Each accepted answer earns 10 base points, regardless of answer length or level.
Fast red targets add 5 points; orange bonus targets add 10. A streak adds 1 point
for each consecutive correct answer after the first, capped at 5 extra points
from the sixth answer onward. The HUD shows the streak and the current bonus.

An answer clearing multiple matching words earns one award using the highest
target bonus and advances the streak once. Wrong non-empty submissions,
incorrect touch groups and missed falling words reset the streak without
removing earned points. Empty submissions and unmatched interim voice results
do not reset it. Streaks carry across level changes and pauses; a new game starts
at zero. Letting an optional orange target leave does not break the streak.
The plugin's `game_over_callback` still receives `{ score }`.

The results screen shows final score, answer accuracy, best streak and missed
word count for that game. Misses count targets that hit the base or escape,
including optional orange targets and repeated misses of the same word. Wrong
submissions, unspawned practice words and targets cleared at game end do not add
misses. The unique review-word count is separate. Practice results also show
completed/total words, a percentage and a progress bar; goal rounds show goal
progress. Accuracy is correct submissions divided by correct plus incorrect attempts
(including rejected touch groups); missed words, empty entries and unmatched
interim voice results are excluded. With no attempts it displays a dash.
Play Again (or Enter) starts a fresh full game with the original supplied data
and active input mode. Menu (or X) returns to the start screen. Each completed
game or practice invokes the unchanged `{ score }` callback once.

## Practising mistakes

Choose Practise My Mistakes (or press P) on the results screen to retry that
game's review words. The option is disabled when no review words were recorded.
Words are deduplicated by question and answer, retaining their original hints
and voice text. No review history is saved beyond the current game flow.

The review includes missed targets and unanswered words when the game ends.
A wrong touch choice records only its selected word. Keyboard and voice input
can answer any visible question, so an unmatched final answer records the
visible candidate questions rather than guessing which one was intended.
Empty input and unmatched interim voice results do not add review words.
Missing an optional orange target adds it to review without breaking a streak.

Practice presents one normal word at a time, with no escalating waves or level
timer. A missed word remains available to retry. Progress advances only when a
word is answered correctly, and practice finishes once every review word has
been answered correctly (or the base is lost). Score, accuracy and streaks start
fresh. If the base is lost, every unfinished practice word stays in the next
review list, including words that have not appeared yet, alongside mistakes
recorded during that practice round. Play Again and Menu always retain the
original full dataset; practising a subset never overwrites the host's supplied
words.

## Controls

Sound: On/Off controls all game sound effects and spoken answers, and stops a
spoken answer immediately when muted. It is available on the start, gameplay,
pause and results screens. The setting carries across levels, replay and
practice within that game instance; a new instance starts with sound on.
It does not change voice-input microphone recognition or mute the host page.
Spoken answers use a separate hidden frame and speech queue per game, removed
when the host destroys the game. Finished utterances release their ownership.
A speech coordinator shared with accessible same-origin parent windows gives
host speech priority and allows one game to speak at a time. It temporarily wraps the current
`window.speechSynthesis.speak` method, interrupting game output before starting
host speech, and restores the method when the last game using speech is destroyed.
Hosts should call the current method rather than retaining an earlier bound
copy. Voice output still depends on the browser's speech implementation.

Correct answers score and stop fully visible matching words immediately; shots are visual
feedback. Score and target effects update immediately; the HUD shows accepted
answers and points when a correction is not being read. Base health appears as
a bar and remaining-block count. Each word hitting a block removes one health.
Incorrect entries do not damage the base, and keyboard answers remain editable
until accepted. Low health is labelled as well as coloured.

Corrections pair the original question with a clearly labelled correct answer.
Missed words and their optional hints remain in the playfield for 3.2 seconds;
successful answer labels keep their shorter 1.5-second display. The HUD shows
the question above a larger green correct answer, distinguishing base hits,
missed falling words and missed optional bonuses. Several misses queue up so
their corrections can be read in turn; repeated entries are combined and the
queue is bounded to six pending items. Correct answers still score immediately
while a correction is visible. Corrections use the pausable
scene clock and can continue through the short level countdown.

Wrong touch choices show the answer for the selected question. Keyboard and
voice errors show it when there is only one distinct visible question;
otherwise the game asks the player to try again without guessing which question
they meant. The results screen retains the last question/answer correction,
including the word that destroyed the final base block. Review collection and
the plugin's score-only callback keep their existing behavior.

Choose keyboard, mobile/touch, or voice from the menu. Keyboard players use
Enter to fire and normal text editing, Unicode composition and paste. The
buttons and F1–F4 insert ä, ö, ü and ß; 1–4 remain aliases only when the supplied
answers contain none of those digits. Results shortcuts only act while the
game has focus, so host-page typing cannot trigger replay or navigation. Touch
players tap a question, then build its answer using large tiles in the side
panels; the whole tile responds. Questions select on press with a padded hit area.
Tapping the same question again preserves the partial answer. Spaces are inserted
automatically. Tiles stay in fixed positions for that question, with up to six
choices per page. Longer answers use Back/More controls instead of shrinking the
tiles. Paging preserves the partial answer and does not count as an attempt.
Sliding off a tile cancels its press. Menu leaves the current game. After game over, choose Play Again
or press Enter to replay; choose Menu or press X to return to the start screen.

Choose Pause or press Escape to pause, then choose Continue, Enter, Space or Escape to resume.
Losing window or canvas focus, or hiding the page, also pauses gameplay.
Returning focus never resumes automatically. Countdown, level timing, moving
words and spawn delays freeze together, preserving score, health and typed input.
On mobile, portrait view uses the same pause overlay during gameplay; rotate
to landscape before choosing Continue. These controls also apply to practice.
Voice mode falls back to keyboard if recognition is unavailable. If permission
is blocked or recognition fails, choose Use keyboard to continue the same
session with its score, health, words and goal intact. Press Talk to
begin recognition. Exact interim matches shoot early; unmatched interim text
does not report a miss. Recognition stops on scene pause, blur, level changes
and shutdown. Press Talk again after resuming. Live recognition requires browser
support and microphone permission, and can depend on the browser's service.
Live microphone input and physical mobile devices still need manual checking.

Phaser is the only runtime dependency. TypeScript, Node types, Vite, Vitest,
ESLint and its TypeScript support are development dependencies.
