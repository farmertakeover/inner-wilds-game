# Inner Wilds — 3D Voxel Survival/Adventure Game

A browser-based 3D voxel survival/adventure game built with **Three.js** (CDN, no bundler). Single-file HTML, fully playable in Chrome/Firefox.

**Play it**: `python3 -m http.server 8080` in this directory, then open `http://localhost:8080/inner-wilds-game.html`

---

## Quick Start

```bash
python3 -m http.server 8080 --bind 127.0.0.1
# Open http://127.0.0.1:8080/inner-wilds-game.html
```

### Controls

| Key | Action |
|---|---|
| WASD | Move / Sprint (hold) |
| Space | Jump (hold while moving = auto-jump) |
| Left-click | Mine block / Attack creature |
| Right-click | Place selected item |
| E | Interact (talk to NPCs, activate) |
| F | Center breath (restore resolve) |
| Tab | Toggle inventory |
| C | Toggle crafting |
| 1-9 | Select hotbar slot |
| Q | Drop held stack |
| Right-click (food) | Eat/drink the selected consumable |
| M | Main menu |
| V | Toggle 1st/3rd person |
| Enter | Advance dialogue |
| Esc | Release pointer lock |

---

## Full Enhancement Prompt

Copy and paste the prompt below into Claude 4.8, Cursor, or any AI coding agent to have them enhance the game.

---

```
You are a senior game dev and design critic. Your job is to play and critique `inner-wilds-game.html`, then enhance it. This is a browser-based 3D voxel survival/adventure game (Three.js, no bundler, single HTML file). Open it with a local HTTP server (`python3 -m http.server`) and play it in Chrome.

## Before You Code

Play the game thoroughly first:
- Walk around, jump, sprint, swim
- Mine blocks, place blocks, craft items (Tab key)
- Talk to the Cartographer (E key near NPCs)
- Fight Hollowlings (left-click monsters)
- Try butterfly/firefly catching, placing torches
- Press F to center yourself
- Watch the day/night cycle, weather, sun, moons
- Open Settings (M menu or Start menu)

Read `tests/test-qa-visual.js` to understand the automated QA harness.
Read `tests/test-auto-play.js` to understand the HTTP playthrough system.

## Architecture Overview

`inner-wilds-game.html` is ~3000 lines, all in one file. No build step. Three.js loaded from CDN.

### Key variables (module-scoped, accessible in console via `window.*` not guaranteed):
- `camera` / `scene` / `renderer` — standard Three.js, camera is `scene.add(camera)` now
- `player` — `{ pos, velY, inventory, hotbar, selectedSlot, primaryHeld, mining, grounded, hp, hunger, temperature, resolve, noise, monstersRepelled }`
- `dayTime` — 0..1 float, drives sun position
- `weather` — `{ type, intensity }`
- `soundVolume`, `musicVolume`, `sfxVolume` — audio mix
- `renderDistance` — chunks radius (2-8)
- `agents` — array of NPC/monster groups
- `placedFoliage` — array of sprite meshes (grass, flowers, bugs, torches)
- `musicNodes` — `{ calm, danger, calmVolume, dangerVolume, calmTarget, dangerTarget, dangerLevel }`

### Systems:
- **World**: 64×40×64 chunked voxel grid, greedy-meshed visible faces, baked vertex-color lighting
- **Textures**: Procedural canvas atlas per block type (moss, dirt, stone, etc.)
- **Water**: Per-voxel surface quads (not a giant plane) for correct shoreline
- **Foliage**: Grass/flowers are cross-plane sprites with canvas textures; butterflies are 3D groups (body + wings); fireflies are InstancedMesh
- **Audio**: Web Audio API oscillators for SFX, HTMLAudioElement loops for music (dual CC0 tracks crossfaded)
- **Day/Night**: Sun angle drives light color/intensity, moon phase, firefly activity
- **Quests**: Hidden waystones + chart recovery + Hollowling defeat
- **QA**: Append `?test` to load in QA mode — runs 61 self-tests and renders results in `#qaPanel`
- **Automated Testing**: `GAME_URL=http://127.0.0.1:8080/inner-wilds-game.html node tests/test-auto-play.js` runs a headed browser playthrough

## Priority Issues to Fix (ordered by impact)

### CRITICAL UX
1. **Hands barely visible** — `buildFirstPersonHands()` at line ~728. Arms are too small (cylinder 0.10×0.10×0.30, hand sphere radius 0.08). Enlarge arm width to 0.16, hand radius to 0.12. Keep group at `(0, -0.38, -0.55)`. Add `depthTest: false` to skin/sleeve materials to prevent z-fighting with world geometry.
2. **No player model for 3rd person** — Add `buildPlayerModel()` that creates a simple humanoid (head sphere + body box + limb boxes). Add a `thirdPerson` boolean toggled by V key. When thirdPerson: set `handRig.group.visible=false`, position camera at `player.pos + offsetBehindAndAbove`, have camera lookAt player. Player model should hold the selected item in its right hand (copy `updateHandItem()` logic onto the model).
3. **Creatures not reliably hit** — The raycaster in `pointerdown` hits `agentMeshes` but misses when agents' children meshes haven't had `updateMatrixWorld(true)` called. In `raycast()`, call `scene.updateMatrixWorld(true)` before the agent intersection test. Also widen the `raycaster.far` to 6×BLOCK for combat.
4. **Torch placed as block** — Type 5 needs to route through `addPlacedFoliage()` in `placeSelected()` (already partially done; verify). The torch sprite should emit a `THREE.PointLight(0xff8833, 0.4, 8)` at its position. When mining a placed torch, return a torch item.

### VISUAL & ATMOSPHERE
5. **Celestial bodies look fake** — Sun/moon at `updateCelestialBodies()` are plain spheres. Add a lens flare / glow sprite parented to sunMesh (large semi-transparent Sprite with additive blending). Add a starfield: create a THREE.Points with ~2000 small white vertices on a large sphere (radius 300), visible only when `nightFactor > 0.3`.
6. **No dynamic sky** — Replace static background with a sky gradient. Create a large sphere (sky dome) with vertex colors that lerp through a dawn/day/dusk/night color ramp based on `dayTime`. Or simpler: use 4 canvas gradients and lerp `scene.background` between them as a THREE.Color.
7. **Water is flat** — In `buildWaterMesh()` or `updateWaterMesh()`, apply sin-based vertex displacement: `y += sin(x * 0.3 + time * 2) * 0.05 + sin(z * 0.4 + time * 1.7) * 0.04`. Make water material transparent with `opacity: 0.6` and `color: 0x3a7a8a`.
8. **No crosshair** — Add a simple CSS crosshair (`+` in center of screen, pointer-events: none).

### GAMEPLAY
9. **Combat is shallow** — Sword swing needs cooldown (prevent mining while swinging). Add `player.swingCooldown` timer. Monsters should take knockback (apply velocity away from player). Add floating damage numbers (temporary sprite that floats up and fades). Monster death: tween scale to 0 over 0.3s, then particle burst.
10. **Survival meters don't matter** — Hunger depletes 3× faster. Add 5 food items with varying saturation. Temperature: player moves 20% slower when freezing (< 20°), takes damage over time. Standing within 3 blocks of a placed torch restores warmth at +15°/s.
11. **Crafting is too limited** — Add `RECIPES` array with 25+ recipes: wooden pickaxe (3 sticks + 2 planks), stone pickaxe (2 sticks + 3 stone), iron pickaxe (2 sticks + 3 iron ingot), armor pieces, food (berries + bowl = stew), potions (bottle + flower = health). Add recipe discovery: first time you hold an item, its recipes unlock with a toast.
12. **Inventory UX** — Add Q to drop current stack. Add Shift+click to quick-move between inventory and hotbar. Add auto-sort button. Show total stack count in hotbar slots.

### SYSTEMS & POLISH
13. **Tool tiers** — Add mining speed multiplier per tool type: hand=1×, wooden=1.5×, stone=2.5×, iron=4×. Each tier has different damage vs monsters. Display tool icon in hotbar.
14. **Sound FX** — Add footsteps (play at intervals based on movement speed, use filtered noise oscillator). Water splash (higher pitched noise when entering/exiting water). Item pickup (short rising tone). Replace `playMineSound` with a more pleasant chipping sound (no retro square wave).
15. **Monster AI** — When `awake=true`, Hollowlings should path toward player at 3m/s. When within 2 blocks, they stop and deal damage (contact damage). When HP < 30% of max, they flee. Add a simple state machine: IDLE → CHASING → ATTACKING → FLEEING.
16. **Chunk stutter** — Replace movement-gated rebuild with chunk-boundary-crossing rebuild. Only rebuild when `Math.floor(player.pos.x / (CHUNK_SIZE*BLOCK))` or `Math.floor(player.pos.z / (CHUNK_SIZE*BLOCK))` changes. Cache visible chunk keys in a Set and diff.
17. **Save/load** — Expand localStorage save to include: `player.inventory`, `player.hotbar`, `player.selectedSlot`, `player.hp`, `player.hunger`, `player.temperature`, `player.resolve`, `player.monstersRepelled`, `quests`, `placedFoliage` positions/types. Auto-save every 30s via `setInterval`. Load on `init()`.
18. **Loading screen** — Add a fullscreen loading overlay with progress bar. During `rebuildVisibleChunks(true)` in init, track chunks generated and update progress. Hide overlay when first chunk batch completes.

### BUGS
19. **Tunneling through ground** — Swept collision at line ~2549 checks 3×3 columns but still misses at very high velocity (> 30 units/frame). Add a second pass: if `player.velY < -20`, force a raycast downward from the player's feet to find ground, clamping pos.y.
20. **Dialogue not keyboard-friendly** — Dialogue buttons show `[1] [2]` prefix from `showDialogue()` but some don't. Add a `data-key` attribute to each button and highlight when corresponding number key is pressed.
21. **Music loop click** — If `loop` attribute on HTMLAudioElement produces audible click at boundary, switch to Web Audio API: `fetch` the MP3 as ArrayBuffer, decode, create `AudioBufferSourceNode` with `loop=true`, connect to gain node. Use `setValueAtTime` for smooth volume changes.

## Testing After Each Change

1. Load `inner-wilds-game.html?test` — must show "Self-test: 61/61 passed" (or updated count)
2. Run `GAME_URL=http://127.0.0.1:8000/inner-wilds-game.html node tests/test-auto-play.js` — must exit cleanly with no crashes
3. Manually verify the feature works in a headed browser

## Code Conventions

- No external dependencies beyond Three.js CDN
- Single file, no build step
- ES module context (`<script type="module">`)
- Use `const`/`let`, no `var`
- 2-space indentation, no semicolons (current style is mixed — match surrounding code)
- Toast for player feedback: `toast('message')`
- Spawn particles: `spawnParticle(position, hexColor, count, spread)`
- Play SFX: `playSound(freq, duration, type='sine', vol=0.15)`
- Show dialogue: `showDialogue('Speaker', 'text', [{label:'Choice', action:callback}])`
- Keys: `showCrafting`, `showBanner`, `completeQuest`, `addToInventory`, `renderQuickbar`
- `renderQuickbar()` must be called after inventory changes to sync UI
- Block types: defined in `BT` object, keyed by numeric ID

## File Reference

| File | Location |
|---|---|
| Game HTML | `inner-wilds-game.html` |
| Backup (detailed models) | `inner-wilds-game-backup.html` |
| QA visual tests | `tests/test-qa-visual.js` |
| HTTP playthrough | `tests/test-auto-play.js` |
| Test setup docs | `tests/README.md` |
```

---

## Recurring Improvement Strategy

Every time an AI agent works on this game, follow this loop:

### 1. Research Phase
Before writing a single line of code, the agent should:
- Play the game in a browser for 5+ minutes
- Read the QA test file to understand what's tested
- Read the automated playthrough to understand the smoke test
- grep through the HTML file to find relevant code sections

### 2. Plan Phase
- Identify the top 3 issues that would make the biggest player experience improvement
- Trace the full code path for each issue (input → update → render)
- Check if any existing functions already handle part of it

### 3. Implement Phase
- Make changes one at a time
- Run QA (`?test`) after each change
- Run automated playthrough after each change
- Verify manually in headed browser for visual changes

### 4. Commit Phase
- Commit with descriptive message: `"fix: description of change"`
- Push when a logical batch is complete

### 5. Recurse Phase
- The agent should note what new issues or opportunities it discovered while working
- Update this README with new findings
- Start the next session with the fresh context

---

## Advanced: Recursive AI Agentic Research Pipeline

For maximum improvement velocity, you can run a **multi-agent recursive pipeline** where AI agents research, implement, and review in parallel:

### Architecture

```
┌─────────────────────────────────────────────┐
│           RESEARCH AGENT (Claude)            │
│  - Reads all source files                    │
│  - Searches web for best practices           │
│  - Identifies 10 highest-impact changes      │
│  - Outputs: `research/findings.md`           │
└────────────┬───────────────────────────────┘
             │ feeds into
             ▼
┌─────────────────────────────────────────────┐
│           PLANNING AGENT (GPT-4o)           │
│  - Takes research findings                  │
│  - Produces detailed implementation spec    │
│  - Breaks into independent parallel tasks   │
│  - Outputs: `plan/sprint.md`                │
└────────────┬───────────────────────────────┘
             │ splits into tasks
             ▼
┌─────────────────────────────────────────────┐
│        IMPLEMENTATION AGENTS (parallel)      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Agent 1 │ │  Agent 2 │ │  Agent 3 │    │
│  │  (Graph) │ │  (Audio) │ │  (Combat)│    │
│  └──────────┘ └──────────┘ └──────────┘    │
│       Each runs QA after changes             │
└────────────┬───────────────────────────────┘
             │ merge changes
             ▼
┌─────────────────────────────────────────────┐
│         REVIEW AGENT (Claude Code)          │
│  - Reviews diff for regressions             │
│  - Runs full QA suite                       │
│  - Runs automated playthrough               │
│  - Signs off or requests fixes              │
└────────────┬───────────────────────────────┘
             │ ship
             ▼
┌─────────────────────────────────────────────┐
│         DOCUMENTATION AGENT                 │
│  - Updates README with new features         │
│  - Updates tests for new functionality      │
│  - Records decisions in ADR format          │
└─────────────────────────────────────────────┘
```

### How to Run It

```bash
# Step 1: Research
claude "Read inner-wilds-game.html and research/investigate the codebase. Output findings to research/findings.md"

# Step 2: Plan (use the prompt above)
gpt4o "Take research/findings.md and produce plan/sprint.md with parallel task breakdown"

# Step 3: Implement (run agents in parallel terminals)
# Terminal 1
claude "Implement spec from plan/sprint.md task 1 in inner-wilds-game.html. Run QA after."
# Terminal 2  
claude "Implement spec from plan/sprint.md task 2 in inner-wilds-game.html. Run QA after."
# Terminal 3
claude "Implement spec from plan/sprint.md task 3 in inner-wilds-game.html. Run QA after."

# Step 4: Merge & Review
claude "Merge all changes and review the full diff. Run QA suite and automated playthrough."

# Step 5: Document
claude "Update README.md and tests for any new features added."
```

### Auto-Research Topics

When the research agent runs, it should investigate these topics to inform game improvements:

1. **Three.js best practices 2026** — Are we using deprecated APIs? What's the recommended approach for instanced mesh updates, fog, render pipeline?
2. **Voxel game rendering research** — How do Minecraft-like games optimize chunk meshing in Three.js? Is greedy meshing optimal?
3. **Procedural content generation** — What noise algorithms produce the most interesting terrain? How to add caves, overhangs, floating islands?
4. **Web Audio API spatial audio** — Can we add 3D positioned sounds? How to do smooth crossfades without clicks?
5. **Mobile touch controls for 3D games** — What control schemes work best for mobile FPS? How to implement virtual joysticks?
6. **AI behavior trees for games** — Simple state machine vs behavior tree for monster AI? How to implement pathfinding on a voxel grid?
7. **LocalStorage vs IndexedDB for game saves** — When does localStorage hit limits? How to migrate to IndexedDB?
8. **WebGL performance profiling** — How to profile draw calls, shader complexity, memory usage in Chrome DevTools?

### Research Agent Prompt Template

```
You are a research agent. Investigate this topic for the Inner Wilds game:
[TOPIC]

Read relevant sections of inner-wilds-game.html first.
Then use web search to find:
1. Current best practices
2. Common pitfalls
3. Implementation patterns that work well

Output a concise findings document with:
- Summary (2-3 sentences)
- Recommended approach (specific code patterns)
- What to avoid
- Priority (critical/high/medium/low)
- Estimated implementation effort (minutes)
```

---

## Story & Lore

### Premise
You wake on a fragment of a long-shattered island, floating in an endless starry void. The island pulses with faint residual energy — echoes of a civilization that learned to crystallize memory into stone.

### The Cartographer
A blue-cloaked figure with a satchel full of half-drawn maps. They remember the island before it broke. They're searching for the **Waystone Chart** — a map of resonance points that, when activated, may reveal how to restore the land.

### Hollowlings
Dormant guardians that once protected the island's secrets. Stirred by noise (mining, combat), they patrol and attack. They can be avoided by moving quietly, or fought head-on for resources.

### Waystones
Ancient monoliths hidden across the island. Restoring them (by placing specific crystals found underground) slowly reveals the Waystone Chart. All six must be restored to complete the map.

### The Goal
Recover the Island Chart from the Cartographer by restoring the waystones. Decide whether to fight or befriend the Hollowlings. Uncover what shattered the island in the first place.

---

## AI Enhancement Log

### Session 1 (Initial Build)
- Full voxel world with chunked meshing
- Day/night cycle, weather, survival meters
- First-person controls, mining, placement
- Crafting, inventory, hotbar
- Ambient creatures (butterflies, fireflies, grass, flowers)
- NPCs: Cartographer, Glass Elk, Lantern Hare
- Hollowling monsters with combat
- Music system with dual CC0 tracks
- QA framework: 61 self-tests

### Session 2 (Bug Fixes)
- **Music loop cuts**: Added timeupdate fade at loop boundary (later removed — caused empty space)
- **Tunneling through ground**: Added swept vertical collision check
- **Fullscreen black bar**: Added resize handler + CSS object-fit
- **Hand visibility**: Repositioned higher, camera added to scene for rendering
- **Butterfly/firefly sprite placement**: Cross-plane sprites instead of solid blocks
- **Jump velocity**: Reduced from 17 to 14
- **Settings split**: Separate Music Volume and SFX Volume sliders
- **Dialogue keyboard**: Number keys + Enter select choices without unlocking cursor
- **Celestial bodies**: fog:false, depthTest restored, offset 180, sunDist 200
- **Camera pitch**: Widened to -1.55..1.55 for near-full vertical look
- **Mining sound**: Removed retro square wave
- **Torch model**: Cross-plane sprite with held light
- **Torch illumination**: PointLight on held torch, toggled in updateHandItem
- **Creature damage**: Removed type==='monster' restriction, all agents hittable
- **Firefly illumination**: Increased to 4.5 intensity, range 16
- **Arm redesign**: Bottom corners, smaller, pointing upward, depthTest removed

### Session 3 (Enhancement Prompt Pass)
Worked through the "Priority Issues to Fix" list from the enhancement prompt. Self-test suite grown from 61 to 74 checks, all passing, with a clean automated playthrough (0 page errors).

- **#1 Hands** — enlarged arms (0.16) and hands (0.12), `depthTest:false` + `renderOrder` so they never z-fight the world
- **#2 Third person** — `buildPlayerModel()` humanoid, `V` toggles `thirdPerson`; camera pulls behind/above and looks at the player, hands hidden, model holds the selected item and walk-animates
- **#3 Combat raycast** — `scene.updateMatrixWorld(true)` before agent intersection, widened combat reach to 6 voxels
- **#4 Torch light** — placed torches (`addPlacedFoliage`) now parent a warm `PointLight`
- **#5 Celestial** — additive sun glow Sprite + 2000-point starfield that fades in at night
- **#6 Sky** — dawn/day/dusk/night color ramp lerped into `scene.background`/fog
- **#7 Water** — sin-based vertex wave animation via `updateWaterMesh()` (base positions cached)
- **#9 Combat depth** — `player.swingCooldown` (blocks mining mid-swing), knockback impulse, floating damage-number sprites, monster death scale tween + particle burst
- **#10 Survival** — hunger drains ~3× faster, freezing (<20°) slows movement 20%, placed torches radiate warmth, edible food/potions
- **#11 Crafting** — expanded to 27 recipes (tools, weapons, food, potions, armor, materials) with first-time recipe-discovery toasts
- **#12 Inventory** — `Q` drops the held stack, Shift+click moves items between bag/hotbar, Auto-Sort button, hotbar stack counts
- **#13 Tool tiers** — `miningMultiplier()` (hand 1× → iron pickaxe 4×) and per-tool combat damage
- **#14 Sound** — footsteps (filtered noise), water-entry splash, pickup chime, gentle mining chip
- **#15 Monster AI** — IDLE → CHASING → ATTACKING → FLEEING state machine; flees under 30% HP, contact damage reduced by worn armor
- **#17 Save/Load** — full state (inventory, hotbar, meters, quests, placed foliage, pos, time) to localStorage, autosave every 30s + on unload, restored on init
- **#18 Loading screen** — progress overlay driven through the async init sequence
- **#19 Tunneling** — extra downward floor clamp when falling faster than 20 u/s
- **#20 Dialogue** — choice buttons carry `data-key` and flash when the matching number key is pressed

Already-satisfied items confirmed in place: #8 crosshair, #16 chunk-boundary-gated rebuild.

---

## Testing

### Manual QA
Open the game with `?test` URL parameter to run the embedded self-test suite. Results appear in a green/red panel.

### Automated Playthrough
```bash
GAME_URL="http://127.0.0.1:8080/inner-wilds-game.html" \
PLAYWRIGHT_BROWSERS_PATH="/nix/store/.../playwright-browsers" \
node tests/test-auto-play.js
```

The playthrough script walks through the game automatically: starts game, moves around, mines, places, crafts, interacts with NPCs, and catches creatures. Exits with code 0 on success.

### Writing Tests
Add test functions to the `?test` block in `inner-wilds-game.html`. Each test calls `check(label, condition)` and results are aggregated. Pattern:
```js
check('Description of what is tested', someCondition === expectedValue);
```

---

## Project Structure

```
inner-wilds-game/
├── inner-wilds-game.html         # Main game (single file)
├── inner-wilds-game-backup.html  # Backup with original detailed models
├── README.md                     # This file
├── .gitignore
└── tests/
    ├── README.md                 # Test setup documentation
    ├── test-qa-visual.js         # QA visual test runner
    ├── test-auto-play.js         # HTTP playthrough script
    ├── test-auto.js              # Utility for auto tests
    └── run-test.sh               # Test runner script
```
