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

## Controls

Choose keyboard, mobile/touch, or voice from the menu. Keyboard players use
Enter to fire and Backspace to edit; 1, 2, 3 and 4 insert ä, ö, ü and ß. Touch
players select a question and tap character groups; spaces are inserted
automatically. Menu leaves the current game. After game over, click or press X
to return to the menu.

On mobile, portrait view pauses play until you rotate and press Continue.
Voice mode falls back to keyboard if recognition is unavailable. Press Talk to
begin recognition. Exact interim matches shoot early; unmatched interim text
does not report a miss. Recognition stops on scene pause, blur, level changes
and shutdown. Press Talk again after resuming. Live recognition requires browser
support and microphone permission, and can depend on the browser's service.
Live microphone input and physical mobile devices still need manual checking.

Phaser is the only runtime dependency. TypeScript, Node types, Vite, Vitest,
ESLint and its TypeScript support are development dependencies.
