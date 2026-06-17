# Inner Wilds - NixOS Test Setup

## Working: Playwright QA (37/37 pass)

```bash
PLAYWRIGHT_BROWSERS_PATH=/nix/store/v3wx56llhynpk430pqy015ds22i7sgyj-playwright-browsers PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 node test-qa-visual.js
```

Uses nixpkgs chromium via `executablePath`. No FHS issues.

## Working: HTTP Gameplay Playthrough

Pointer lock should be tested through local HTTP, not `file://`.

```bash
python3 -m http.server 8127 --bind 127.0.0.1 --directory /home/giovanniz/Documents &
GAME_URL=http://127.0.0.1:8127/inner-wilds-game.html PLAYWRIGHT_BROWSERS_PATH=/nix/store/v3wx56llhynpk430pqy015ds22i7sgyj-playwright-browsers PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 node test-auto-play.js
```

## Test Output

```
=== QA Panel (with ?test) ===
Self-test: 37/37 passed
PASS - World has chunks loaded chunks=49
PASS - World has chunk meshes meshes=46
PASS - Chunk meshes use valid quad indices
PASS - Chunk lighting uses baked vertex colors
PASS - Block texture atlas active
PASS - Renderer tone mapping enabled
PASS - Player spawned above ground
PASS - Ground lookup uses world units
PASS - Collision stand check active
PASS - Water mesh exists
PASS - Swimming water lookup uses world units
PASS - Void floor exists
PASS - Ambient meshes exist
PASS - Grass and flowers textured
PASS - Flowers are sprites not voxel cubes
PASS - Procedural ruins generated ruins=3
PASS - Agents placed
PASS - Agent models are detailed agentMeshes=226
PASS - Hollowlings start dormant
PASS - Waystones are restored
PASS - Particle system ready
PASS - In-world mining feedback ready
PASS - First-person hands ready
PASS - Combat raycast targets monsters agent
PASS - Day/night system active
PASS - Weather system active
PASS - Mouse sensitivity is settings-driven
PASS - Render distance adjustable
PASS - Inventory starts empty
PASS - Survival meters tracked
PASS - Hotbar has slots
PASS - Crafting recipes defined
PASS - Block types defined
PASS - Mining system ready
PASS - Combat system ready
PASS - Sound system ready
PASS - Settings persistence ready
```

## GStack Browser (Headed with Sidebar)

The compiled `browse` binary has NixOS issues:
- Bundled Playwright chromium needs 22 FHS libraries
- Compiled Bun binary expects `bun` on PATH for server subprocess

### Quick Steam-run Attempt

```bash
# Requires: steam-run installed (already present)
steam-run node /tmp/opencode/gstack/browse/dist/server-node.mjs
```

But needs full library environment. For now, use the Playwright test above.
