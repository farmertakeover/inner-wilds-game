# AGENTS.md

## Cursor Cloud specific instructions

### What this project is
`inner-wilds-game.html` is a single-file, browser-based 3D voxel game built on Three.js. There is **no build step and no package manager** — Three.js and audio assets are loaded from CDNs (`cdn.jsdelivr.net`, `cdn.freesound.org`) at runtime, so the VM needs outbound network access for the game to fully load.

### Running the app (dev)
Serve the directory over HTTP and open the game (pointer lock / controls require HTTP, not `file://`):

```bash
python3 -m http.server 8080 --bind 127.0.0.1
# open http://127.0.0.1:8080/inner-wilds-game.html
```

`python3` is the only runtime needed to run the game. A headed browser (`google-chrome` is installed) is needed to actually play it.

### Lint / build
There is no linter and no build step in this repo. "Building" is just opening the HTML file.

### Tests
- **Embedded self-test (preferred, works here):** open `http://127.0.0.1:8080/inner-wilds-game.html?test`. It runs the in-page QA suite and renders a panel showing `Self-test: NN/NN passed` (currently 43/43). This is the reliable smoke test in this environment.
- **`tests/` scripts are NOT runnable as-is:** `test-auto-play.js`, `test-auto.js`, `test-qa-visual.js`, and `run-test.sh` hardcode NixOS-only paths (`/nix/store/...chromium`, `/tmp/opencode/.../node_modules/playwright`). They are leftovers from the original author's NixOS box and will fail on this Ubuntu VM. To run an automated headless playthrough here, point Playwright/Puppeteer at the installed `google-chrome` instead of the hardcoded nix paths.

### Gotchas
- If you open `?test` in one tab and then the normal game in another, the QA results panel can remain visually overlaid — harmless, just reload the plain URL.
- Missing `favicon.ico` / `test.ico` 404s and WebGL driver warnings in the console are cosmetic and do not affect gameplay.
