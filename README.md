# Inner Wilds — 3D Voxel Survival/Adventure Game

**Current version: `v0.17.0` — "Berry Bushes & Death Compass"** (shown in main menu and top-right HUD badge).

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
| WASD | Move / Sprint (hold shift) |
| Space | Jump (hold while moving = auto-jump) · Exit boat while boating |
| Left-click | Mine block / Attack creature / Hold + release to fire bow |
| Right-click | Place selected item / Eat food / Drink potion / Use bound Time Pendant power |
| E | Interact (talk to NPCs, activate) |
| T | Open Time Pendant menu when the pendant is selected |
| F | Center breath (restore resolve) |
| Tab | Toggle inventory + Journal/Quests |
| C | Toggle crafting |
| 1-9 | Select hotbar slot |
| Mouse wheel | Scroll up = move right on hotbar; scroll down = move left |
| Q | Drop the selected stack |
| M | Main menu (New Game / Continue / Settings) |
| V | Toggle 1st/3rd person |
| Enter | Advance dialogue |
| Esc | Release pointer lock |
| F5 | Toggle third-person view |

---

## Story & Lore

### Premise
You wake on a fragment of a long-shattered island, floating in an endless starry void. The island pulses with faint residual energy — echoes of a civilization that learned to crystallize memory into stone.

### The Cartographer
A blue-cloaked figure with a satchel full of half-drawn maps. They remember the island before it broke. They're searching for the **Waystone Chart** — a map of resonance points that, when activated, may reveal how to restore the land.

### The Hollow Surveyor
The Surveyor was once the island's geomancer — the one who mapped the memory-lodes and calibrated the waystones. When the shattering came, they refused to leave their post. Now they drift within a brass compass-rim, their map-panels orbiting like planets, guarding the deepest waystone. They speak in route-directions. They do not remember friendship.

The Surveyor has three phases:
- **Phase 1**: Shockwave attacks, walks toward the player
- **Phase 2**: Fractures the ring — teleports around the arena, charges at the player, summons Echo minions
- **Phase 3**: Ground slams, multi-ring shockwaves, rapid charges, desperate Echo summons

### Hollowlings
Dormant guardians that once protected the island's secrets. Stirred by noise (mining, combat), they patrol and attack. They can be avoided by moving quietly, or fought head-on for resources. Night spawns are capped at 7 per night to prevent overwhelming the player.

### The Archipelago
Five islands in a crystalline sea:
| Island | Biome | Radius | Character |
|--------|-------|--------|-----------|
| **Survey Isle** (0,0) | Mixed — flatland, ashen, amber, mirror, mosswood | 58 | The starting island, holds the Cartographer and the Surveyor's arena |
| **Amberreach** (118, 14) | Amber desert, warm microclimate | 30 | Home of the Tide Waystone |
| **Misthold** (-34, 120) | Soft-fog weather, cool and damp | 34 | Dense foliage, quiet |
| **Ashen Spur** (-114, -44) | Ash plains, ember-toned palette | 30 | Hostile Hollowling dens |
| **Glasslight Key** (74, -110) | Mirror-shard beaches, icy shallows | 26 | Crystal formations, Glass Elk territory |

### Waystones
Ancient monoliths hidden across the islands. Restoring them (by studying the Cartographer's notes) slowly reveals the Island Chart. Three waystones are placed at session start; others wait to be discovered on distant islands.

---

## Architecture

### Overview

`inner-wilds-game.html` is ~6900 lines, all in one file. No build step. Three.js loaded from CDN (`<script type="module">`).

### Key Module-Scoped Variables
- `camera` / `scene` / `renderer` — standard Three.js, camera is added to scene
- `player` — `{ pos, velY, inventory, hotbar, hp, hunger, temperature, resolve, noise, monstersRepelled, trusted, waystones, discovered, boating, grounded }`
- `dayTime` — 0..1 float, drives sun position
- `weather` — `{ type, intensity }` — one of: clear, softFog, mirrorRain, emberAsh
- `agents` — array of NPC/monster/boss/animal groups
- `chunks` — Map of chunk key → Uint8Array voxel data
- `chunkMeshes` — Map of chunk key → Three.js Mesh (greedy-meshed)
- `blockEdits` — compact journal of player voxel edits replayed over regenerated chunks on load
- `placedFoliage` — array of placed pickup-friendly meshes (grass, flowers, bugs, torches, boats, bedrolls)
- `droppedItems` — array of dropped item entities
- `arrowProjectiles` — physical bow arrows; freeze during time stop and resume flight afterward

### Rendering Pipeline

```
animate() → updatePlayer() → updateSurvival() → updateCamera() → 
updateMining() → updateAgents() → updateParticles() → 
updateHands() → renderFrame()

renderFrame():
  1. camera.layers.enable(VIEWMODEL_LAYER)
  2. renderer.render(scene, camera)
  3. Viewmodel materials use depth-safe settings + renderOrder so arms draw cleanly in a single pass
```

### Systems
- **World**: 64×40×64 chunked voxel grid, greedy-meshed visible faces, baked vertex-color lighting
- **Textures**: Procedural canvas atlas per block type (moss, dirt, stone, amber, mirror, iron, ember, etc.)
- **Cel shading**: Terrain and model materials use `MeshToonMaterial` plus a shared `getToonGradient()` ramp for flat anime-style lighting bands
- **Terrain**: `terrainHeight()` with biomes via `terrainZone()` — perlin-based height + island falloff + biome-specific noise overlay
- **Water**: Per-voxel surface quads with animated sin-wave vertices
- **Foliage**: Grass/flowers are cross-plane sprites; butterflies are 3D groups (body + wings); fireflies are InstancedMesh with animated glow
- **Audio**: Web Audio API oscillators for SFX, HTMLAudioElement loops for music (dual CC0 tracks crossfaded via gain nodes)
- **Day/Night**: Sun angle drives light color/intensity, moon phase, firefly activity, starfield visibility
- **First-person viewmodel**: Single-pass draw-on-top model with depth-safe materials and `renderOrder`, replacing the old two-pass overlay that caused ghost limbs on some GPUs
- **Third-person**: Toggle with V, hides viewmodel, shows playerModel with arm-swing animation, camera orbits behind player
- **Collision**: Swept AABB with 1-block-wide footprint support, anti-tunneling clamp, void catch
- **Boss**: Three-phase Hollow Surveyor with shockwave/charge/teleport/ground-slam attacks, minion summoning, arena ring
- **Quests**: Locked → active → done state machine, triggered by exploration and NPC interaction
- **Dropped items**: Physics (gravity + ground collision), 10s lifetime, pickup on contact
- **Boat**: Craftable portable placeable item; can be nudged, placed on sea surface, ridden with `E`, and picked back up
- **Sleep**: Bedroll is a portable placeable item; interact with a placed bedroll to sleep
- **Bow**: Hold LMB to draw, release LMB to fire physical arrows. During Time Stop, arrows hang in mid-air and resume when time returns; RMB does nothing for bows.
- **Time Pendant**: Time Stop, hold-to-size Rewind/Forward, Time Blink, Anchor/Return, Anomaly framework, named temporal debt tiers, timeline overlays, death-retained pendant behavior, and Time Wraith consequences
- **Crafting**: 27+ recipes, recipe discovery toasts
- **Notifications**: General toasts, pickup feed entries, and Time Pendant messages share a non-overlapping bottom-left stack
- **AI**: Hollowling state machine (IDLE → CHASING → ATTACKING → FLEEING), Surveyor Echo minion AI, animal idle wander

---

## Engine Strategy — Dual Track: WebGPU Now, Godot Later

### Problem
Browser performance is jittery. The game needs real GPU headroom to ramp time travel complexity (more agents, more particles, more VFX during rewind/stop). The current Three.js/WebGL path hits CPU bottlenecks on chunk meshing, particle updates, and snapshot comparison.

### Decision: Two Parallel Tracks

**Track 1 — WebGPU (active, current work):** Move rendering and meshing to WebGPU compute shaders while keeping the JS game logic, UI, and save system. This is the fastest path to near-native GPU performance with zero install friction.

**Track 2 — Godot 4 (future, if needed):** Full engine port for console/mobile native builds. Only pursued if WebGPU hits a hard wall or console certification is required.

### Track 1 — WebGPU

WebGPU gives compute shaders, Vulkan/Metal/DX12 backends, and shared CPU/GPU memory — all in the browser. No install, same URL-sharing as today.

| Priority | Task | Why |
|---|---|---|
| 1 | **GPU chunk meshing** | Biggest jitter source. Move `buildChunkMesh()` to a compute shader — feed voxel buffer, get vertex buffer back. ~10x faster. |
| 2 | **GPU particle system** | Particles become buffer updates, zero CPU cost. Time stop = stop updating buffer. |
| 3 | **GPU snapshot comparison** | Compare voxel buffers in parallel on GPU for rewind restore. |
| 4 | **WGSL shader generation** | AI generates WGSL compute shaders from existing JS meshing logic. |

**Why WebGPU over custom Rust/C++ engine:**
- Keeps browser zero-install advantage
- AI generates WGSL well (similar to Rust/HLSL)
- ~1 week to prototype vs 6+ months for custom engine
- Your JS game logic (time powers, quests, UI) stays untouched
- If WebGPU works, you ship from the browser. If it doesn't, you learned GPU programming and can port to Godot with that knowledge.

**Risks:**
- WebGPU debugging is harder than JS debugging
- WGSL is new — smaller ecosystem than GLSL/HLSL
- Some older GPUs may not support WebGPU (but all modern ones do)

### Track 2 — Godot 4 (Future)

Godot remains the fallback for native console/mobile builds. Porting order if WebGPU is insufficient:

1. World generation (terrain, chunks, biomes)
2. Player controller (movement, collision, camera)
3. Time powers (snapshot, rewind, stop, blink, anchor)
4. UI (hotbar, inventory, journal, notifications)
5. Save/load

Estimated effort with AI help: ~2 weeks for a playable prototype.

### Godot Web Export Gate
Before any real port, make a tiny Godot 4 spike and prove web export first.

| Gate | Pass Criteria |
|---|---|
| Tooling | Godot 4 editor/headless binary installed and matching export templates installed |
| Export | Minimal 3D scene exports to Web without manual patching |
| Browser | Export runs in Chromium and Firefox from a static local server |
| Rendering | Compatibility/WebGL 2 path works with a toon-lit voxel-ish test scene |
| Input | Pointer lock/camera capture works after a user click; hotbar wheel input works |
| Audio | Audio starts only after an explicit click/key press and does not error in browser console |
| Persistence | A `user://` save survives reload in browser storage |
| Performance | 60 FPS target is plausible with a representative chunk/foliage/particle stress scene |

### Current Status
- **WebGPU**: Prototype in progress. Chunk meshing compute shader is the first target.
- **Godot**: No local Godot binary installed. Port deferred until WebGPU track is evaluated.

### Source Notes
- WebGPU spec and tutorials: https://www.w3.org/TR/webgpu/
- WGSL language reference: https://www.w3.org/TR/Wgsl/
- Godot web export: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- Godot export templates required: https://docs.godotengine.org/en/stable/tutorials/export/exporting_projects.html#export-templates

---

## Exhaustive Development Roadmap

> A complete vision for the game as if a professional team of artists, engineers, designers, and writers worked on it for years. Each section is ordered by priority.

---

## Current Production Slice — `v0.17.0` "Berry Bushes & Death Compass"

This slice continues the post-v0.6.0 art pass. The goal is to make the cel-shaded art direction feel complete, not like terrain, characters, items, pickups, sound effects, and music belong to different games.

### Sprint Goal
Make the entire game read as one cohesive cel-shaded adventure: terrain, characters, enemies, boss, animals, items, UI, animations, drops, crafting previews, combat feedback, sound effects, and music should share the same production language.

### Must Ship First
- [x] **Cel-shade every remaining character model**: Player avatar, Cartographer, Hollowlings, Surveyor Echoes, Glass Elk, Lantern Hare, boss panels, boss body parts, waystones, boat, dropped items, and held items must use `modelMat()` / `MeshToonMaterial` with `getToonGradient()`.
- [x] **Unify outline language**: Add a controlled black/dark-blue outline pass or backface shell only for characters, enemies, boss, items, and interactables. Keep terrain outline-free or very subtle so the world does not become noisy.
- [x] **Enemy attack animations**: Add wind-up, active-hit, and recovery animation states for Hollowlings, Surveyor Echoes, and the Hollow Surveyor. Attacks must telegraph before damage happens.
- [x] **Better item models**: Replace plain cubes/boxes with readable low-poly models for sword, bow, pickaxe, axe, torch, bedroll, boat item, food, potions, ore, amber, mirror shards, and waystone fragments.
- [x] **Held-item consistency**: First-person held item, third-person held item, dropped item, inventory preview, and crafting result should use the same model factory per item type.
- [x] **Combat readability**: Add enemy wind-up glow, slash arcs, impact freeze for 80-120ms on heavy hits, hit spark particles, and boss attack warning rings.
- [x] **Performance guardrail**: Embedded QA enforces low-poly mesh/triangle budgets for item, enemy, and boss model factories; deeper geometry pooling and instancing remain tracked in the High FPS section.

### Shipped In v0.7.0
- [x] Shared low-poly toon item model factory: `makeItemModel(type, scale)`.
- [x] First-person held items now use the model factory instead of per-item placeholder meshes.
- [x] Third-person held items now use matching item models.
- [x] Dropped items now use small 3D toon models instead of flat sprites.
- [x] Hollowlings now use wind-up / active-hit / recovery attack timing instead of invisible continuous contact damage.
- [x] Hollowling attack animation pose drives arms/head during the telegraphed attack.

### Shipped In v0.7.1
- [x] Death drops now place every inventory stack exactly where the player died.
- [x] Respawn leaves the loot pile at the death site instead of scattering or moving it.
- [x] Embedded QA verifies each dropped stack type/count and death-location placement.

### Shipped In v0.7.2
- [x] Brightened the core block palette into a pastel anime/cartoony range.
- [x] Reworked generated block texture noise to tint from each block's base color instead of muddy grayscale overlays.
- [x] Softened atlas bevel shadows, ambient occlusion, and side-face lighting so terrain no longer reads overly dark.
- [x] Added an embedded QA guard that checks the terrain palette remains bright enough for the current art direction.

### Shipped In v0.7.3
- [x] Added visible warning telegraphs for Surveyor shockwaves, slams, and charge lanes.
- [x] Delayed boss shockwave/slam damage until after the warning window instead of applying it instantly.
- [x] Charge attacks now show an orange lane/arrow before the Surveyor commits to the dash.
- [x] Embedded QA verifies boss telegraph state, update wiring, and warning lifecycle helpers are present.

### Shipped In v0.7.4
- [x] Added a named pastel cel-adventure `SOUND_PALETTE` for SFX direction.
- [x] Replaced plain bleep-style placement, hit, mining, pickup, splash, footstep, and ambient sounds with softer wood pops, crystal chips, pentatonic sparkles, water shimmer, and low danger pulses.
- [x] Added `MUSIC_STYLE` metadata and an adaptive music color layer that adds restrained day/night shimmer, weather accents, and danger pulse around the existing CC0 loop crossfade.
- [x] Embedded QA verifies the SFX palette and adaptive music color-layer wiring.

### Shipped In v0.7.5
- [x] Added contextual action prompts for talking, studying waystones, earning animal trust, mining, collecting, attacking, placing, and using consumables.
- [x] Added an item pickup feed with icon, count, and inventory confirmation.
- [x] Added a boss health bar with phase ticks and phase label for the Hollow Surveyor.
- [x] Added save feedback showing save slot, timestamp, and game version after successful saves.
- [x] Embedded QA verifies feedback UI elements, update functions, and pickup/save loop wiring.

### Shipped In v0.7.6
- [x] Added a dev/test performance HUD for FPS, frame time, draw calls, triangles, chunks, particles, drops, geometries, and textures.
- [x] Performance HUD appears automatically in `?test` mode and can be enabled with `localStorage.iw_dev_stats = '1'`.
- [x] Embedded QA verifies the performance stats object, HUD node, renderer info wiring, and main-loop update call.

### Shipped In v0.7.7
- [x] Converted remaining `MeshStandardMaterial` to `MeshToonMaterial` (viewmodel hands, boat hull/rail, boss arena ring/pillars).
- [x] Added `toonMat(color, opts)` alias for `modelMat()` API completeness.
- [x] Continuous right-click placement while holding RMB (0.25s cooldown).
- [x] Continuous left-click attack while holding LMB (re-attacks on cooldown when no block is targeted).
- [x] Fixed death drops: removed `!BT[type]` guard from `spawnDroppedItem` so all items drop regardless of BT entry.
- [x] Added embedded QA self-test that verifies boat, hands, boss arena, and agent models use toon/glow materials.

### Shipped In v0.11.x (Performance & Art Consistency)
- [x] **v0.11.0 "Combat Readability"**: Enemy wind-up glow, slash arcs, impact freeze, hit sparks, boss telegraphs.
- [x] **v0.11.1 "Axe Chop & Guardrails"**: Tree collapse with axe, low-poly mesh/triangle budgets via `MODEL_BUDGETS`.
- [x] **v0.11.2 "Dynamic Render Scale"**: Adaptive pixel ratio (0.6–1.0) based on raw frame delta.
- [x] **v0.11.3 "Material Pooling"**: Shared `modelMaterialCache` for all model materials.
- [x] **v0.11.4 "Drop Physics & Geometry Pooling"**: Floor-detection, zero-velocity bark drops, `modelGeometryCache`.
- [x] **v0.11.5 "Agent Geometry Pooling"**: Pooled geometries for monster/boss/NPC body parts.
- [x] **v0.11.6 "Prewarmed Particles"**: Prewarmed particle pool, zero mid-burst allocations.

### Shipped In v0.12.0
- [x] **Always-visible FPS meter**: Lightweight corner overlay with green/yellow/red color coding and render‑scale percentage; works without `?test` or localStorage flag.
- [x] **Collision fix**: Removed ceiling‑height check from `canStandAt()` that prevented stepping into shallow (1‑block‑deep) holes; `wouldHitCeiling()` already handles headroom relative to the player's actual Y.
- [x] **Dirty chunks rebuild immediately**: `remeshDirtyChunks()` rebuilds all dirty chunks at once (1–4 during gameplay) for minimal overhead; `chunkBuildQueue` already spreads new‑chunk builds 8/frame.
- [x] **InstancedMesh audit**: Grass, flowers, fireflies, rain already use `InstancedMesh`; particle pool and geometry pooling cover remaining repeated detail types.
- [x] Embedded QA for FPS meter and collision wiring.

### Shipped In v0.13.0
- [x] **Craftable Time Pendant** (type 80): pendant + chain + glow model, crafted from amber + mirror + iron ingot + glow apple.
- [x] **Time Stop**: Freezes all world updates (agents, particles, day/night, water, weather); player moves freely. Right-click when pendant is selected. Purple tint overlay.
- [x] **Time Rewind** (5/30/60s): Circular snapshot buffer (240 entries at 0.25s intervals). Rewinds player position, HP, hunger, temperature, resolve, day/time, weather, and agent states with a semi-transparent ghost player.
- [x] **Time Fast-Forward** (5/30/60s): Accelerates all world updates 3×.
- [x] **Consequence system**: Each time-pendant use within a 60s window raises a "temporal residue" percentage (0–100). At higher residue, time ripples, wormholes, and temporal echoes spawn with increasing probability.
- [x] **FPS optimizations**: Reduced `MAX_PARTICLES` 120→80; throttled chunk rebuilds to every 4 frames during gameplay (instant when new chunks are queued).
- [x] Embedded QA (125/125): item/recipe/model factory, state wiring, animate integration.
- [x] Time‑menu UI via **T key** when pendant is selected: Stop / Rewind 5s/30s/60s / Forward 5s/30s/60s / Cancel.

### Shipped In v0.14.0
- [x] **Time Anomaly**: When temporal residue ≥40% and the anomaly cooldown (45s) is clear, the pendant can malfunction after any use — flinging the player to a random island at a random time of day with changed weather.
- [x] **Visual feedback**: Purple flash overlay, particle burst, and a "TIME ANOMALY" toast.
- [x] **Cooldown**: 45s between anomalies so they feel special, not spammy.
- [x] Embedded QA (127/127): function existence, deactivation wiring, cooldown integration.

### Shipped In v0.15.0
- [x] **Iron ore veins**: Underground iron ore now generates in noisy vein clusters, enabling iron ingot crafting in normal play.
- [x] **Portable boats and bedrolls**: Boats and bedrolls can be placed on any solid face, then mined/picked back up like other deployables. Placed bedrolls still support sleep via `E`.
- [x] **Single-click placement fix**: Right-click placement now starts a short cooldown immediately, preventing one click from placing two blocks.
- [x] **Icon-first hotbar/inventory**: Item slots no longer print names inside the slot; icons carry identity and counts sit as compact badges.
- [x] **Transparent item art**: Removed the extra colored square behind item icons and redrew core block/item/tool/food/armor/boat/bedroll/pendant icons as transparent silhouette art.
- [x] Embedded QA (131/131): ore generation, portable pickup loop, right-click cooldown, transparent icon backing, and icon silhouette uniqueness.

### Shipped In v0.16.0
- [x] **Persistent player builds across updates**: `blockEdits` journals mined/placed voxel edits and replays them over regenerated chunks on load. Your builds persist while untouched terrain still receives new update-generation logic.
- [x] **Pickup notifications moved to the left side only**: Removed duplicate center pickup toasts. Item pickup feedback now uses the left-side art feed exclusively.
- [x] **Boat physicality**: Placed boats can be nudged by the player, float to sea level, save their moved position, and can be ridden with `E` once pushed onto water.
- [x] **Rolled-out bedroll placement**: Inventory bedroll stays rolled; placed bedroll is now an unrolled sleep mat with pillow, straps, and end roll.
- [x] **Bow interaction**: LMB hold draws the bow, LMB release fires a physical projectile, and the first-person/third-person pose reflects the drawn stance.
- [x] **Temporal arrows**: Arrows fired during Time Stop freeze in mid-air and resume their trajectory when time restarts.
- [x] **Time Pendant bug fixes**: Sleeping is blocked while time is stopped; resume dialogue closes correctly; time can only be stopped/resumed while the pendant is selected.
- [x] **Time Pendant controls in context prompt**: Holding the pendant surfaces `RMB Stop Time`, `RMB Resume Time`, and `T Time Menu` alongside block prompts.
- [x] **Model parity pass**: Bow and pickaxe models now better match the new icon silhouettes.
- [x] Embedded QA (137/137): block-edit persistence, pickup feed, time resume/sleep gating, frozen arrows, bow projectile spawn, and stopped-time player cooldowns.

### Shipped In v0.17.0
- [x] **Nerfed hunger drain**: Base drain reduced ~50%; sprint/water multipliers softened so food management feels natural, not frantic.
- [x] **Berry bushes**: New block type (16) generates in small clusters on grassy terrain; harvest for 2–3 berries each.
- [x] **Death Compass** (item 81): Crafted from 3 iron ingots + 1 glow apple + 1 mirror shard. Tracks your last death coordinates; the held compass model needle points toward your grave without a HUD meter.
- [x] Embedded QA (140/140): hunger nerf verification, berry bush generation, death compass item/recipe/model/UI/tracking.

### Implemented After v0.17.0
- [x] **Time Pendant RMB binding**: Time menu choices now bind the selected power to RMB without triggering immediately; context prompts show the selected power name.
- [x] **Hold-based Rewind/Forward**: Rewind and Forward are single menu options; holding RMB chooses the amount of time, releasing casts it.
- [x] **Extra time powers**: Added Time Blink and Anchor/Return as expert mobility/recovery powers.
- [x] **Death rewind safety**: The Time Pendant is retained on death unless manually dropped, and an active rewind hold can snap through the death screen back to a pre-death snapshot.
- [x] **Death Compass HUD removal**: Removed the on-screen `Death: Xm` meter/red line; direction now lives on the held model needle.
- [x] **Temporal debt meter**: Holding the pendant shows Static/Rifted/Fractured/Hunted/Paradox tiers with a compact HUD meter and tier-specific risk text.
- [x] **Time Wraiths**: High temporal debt can spawn translucent hunters that keep moving while time is stopped.
- [x] **Timeline overlays**: Snapshot ghost silhouettes are hidden during passive pendant holding and only appear during active rewind/forward time playback.
- [x] **Bow control correction**: Bow now uses LMB hold/release only, does not trigger melee while charging, starts weaker, and takes longer to reach full power.
- [x] **Hotbar wheel direction**: Scroll up moves right on the hotbar; scroll down moves left.
- [x] **Unified notifications**: General toasts, pickup feed entries, and Time Pendant messages now stack bottom-left and push older messages upward instead of overlapping.
- [x] **Time VFX performance pass**: Time ripples/portals are capped, sky tears are throttled, and heavy consequence bursts use lower geometry/particle counts to reduce lag after repeated time powers.
- [x] **Dynamic waystone guidance**: Once the waystone quest is active, the journal points to the next unlit waystone with progress, name, direction, and distance/sea-crossing hint.
- [x] **Item clarity labels**: Hotbar, inventory, crafting grid/result, and recipe rows now expose readable names via title/ARIA labels while keeping the icon-first visual layout.
- [x] **Hold Forward correction**: Forward now runs while RMB is held and stops immediately on release, matching Rewind's hold-based control model.
- [x] Embedded QA (155/155): hold-based time menu, death-retained pendant rewind, compass model needle/no HUD, temporal debt tiers, Time Wraith stopped-time movement, timeline overlays, bow RMB/melee ignored, unified bottom-left notifications, dynamic waystone guidance, item labels, hold-forward release behavior, Space boat exit (ghost fixed), rewind world-edit reversal, night-fall banner, time power audio cues, anchor context prompt, timeState save/load persistence, boat ghost hidden after exit.

### Current Focus — Get Golden Before Engine Migration
- [x] **Core loop guidance pass**: New Game → gather basic blocks/berries → craft tools/boat/bow → find Cartographer/waystone direction now has dynamic journal guidance for the next unlit waystone.
- [x] **Item clarity baseline**: Hotbar, inventory, crafting result, and recipe rows expose readable item names for tooltip/screen-reader clarity; visual/model parity remains an ongoing playtest check.
- [x] **Time power feel baseline**: Rewind and Forward both run while RMB is held and stop on release; Time Blink, Anchor/Return, death rewind, Wraith pressure, and temporal debt remain covered by QA guards and playtest feel checks.
- [x] **Night-fall notification**: Banner warns when night approaches so the player can prepare.
- [x] **Time power audio**: Distinct sounds for Stop, Blink, Anchor, Rewind, and Wraith using existing SFX pipeline.
- [x] **Anchor context prompt**: "RMB Return to Anchor" shown when anchor is active.
- [x] **Time state persistence**: Time power state (lastAction, debt, anchor) saved/loaded with game.
- [x] **Boat exit on Space**: Press Space to exit boat immediately.
- [x] **Rewind reverses world edits**: Block edits, placed foliage, and save journal all roll back.
- [ ] **Golden-loop playtest**: Survive night → recover from death → return to goal still needs a manual end-to-end playtest pass.
- [ ] **No more broad systems before playtest**: Defer alternate universes, new bosses, more biomes, multiplayer, and full engine migration until this loop is fun and stable.
- [ ] **WebGPU chunk meshing prototype**: Build compute shader that converts voxel buffer to mesh vertices on GPU. Target: eliminate main-thread meshing jitter.
- [ ] **WebGPU particle system**: Move particle updates to GPU buffers. Target: zero CPU cost for time-stop particle freeze.
- [ ] **Evaluate WebGPU vs Godot**: After prototype, decide if browser performance is sufficient or if native port is needed.

### Future Time Pendant Expansion
- [ ] **Self-meeting paradoxes**: Rewind leaves a past-self echo that repeats the player's prior path. Touching it causes a paradox event; helping it complete the old path creates a reward instead.
- [x] **Time Wraiths**: High temporal debt spawns hunters that exist outside paused time. They do not freeze, phase through normal block constraints while chasing, and punish reckless time abuse.
- [ ] **Era travel**: The pendant can jump the player into Dawn Era, Ruin Era, Hollow Era, or Far Future variants of the same island. Same coordinates, different biome state, enemy ecology, loot tables, and sky.
- [ ] **Alternate universes**: Rare anomaly tears create parallel shards where choices diverged: flooded Survey Isle, overgrown Survey Isle, iron-industrial Survey Isle, empty-dead Survey Isle. Each shard has one resource or secret impossible in the prime world.
- [x] **Timeline overlays**: During active rewind/forward playback, ghost silhouettes show where the player existed 5/30/60 seconds ago; passive pendant holding stays visually clean.
- [ ] **Paradox crafting**: Some recipes require materials from mutually exclusive timelines, forcing the player to carry items across eras without collapsing the loop.
- [x] **Frozen projectile puzzles**: Fire arrows during Time Stop, then resume time to release the shot path for ranged combat/puzzle setups.
- [x] **Temporal debt meter**: Replaced flat residue with named thresholds: Static, Rifted, Fractured, Hunted, Paradox. Higher tiers drive anomaly and Time Wraith risk.
- [ ] **Wormhole routing**: Stable wormholes become buildable shortcuts once the player learns to anchor them with chart-light and mirror shards.
- [ ] **Save-slot timeline identity**: Each save slot can become a canonical universe. Future systems can let a player visit echoes of other save slots as alternate timelines.
- [ ] **Boss-scale time design**: A future boss can split into versions from three eras, requiring the player to pause one, rewind another, and bait the future version into damaging the past version.

### Future Art, Blocks, Leaves, And Mobs
- [ ] **Unique block-top language**: Replace shared stripe/noise tops with per-block visual identity: moss tufts, stone fracture plates, amber veins, mirror glints, ember ash freckles, sand ripples, plank grain, cobble chips, iron flecks.
- [ ] **Anime leaf canopy**: Leaves should be semi-translucent clustered planes with soft alpha, leaf-shaped silhouette noise, color variation, and sunlit rim highlights instead of opaque cubes.
- [ ] **Creature redesign pass**: Keep Hollowlings eerie, but push all creatures into stronger anime silhouettes: bigger shape language, readable eyes, color-coded weak points, and bolder idle animations.
- [ ] **New mob families**: Add ranged Echo Archers, status-effect Sporespinners, shielded Husk Knights, burrowing Ash Eels, mirror-decoy Glasslings, and flying Lantern Moths.
- [ ] **Attack pattern variety**: Ranged volleys, poison/slow/freeze status, charge lanes, teleport feints, shield breaks, pack tactics, and mobs that only move when time is stopped.
- [ ] **Biome encounter tables**: Each island should have distinct ambient entities, hostile mobs, rare spawns, and night escalation patterns.

### Acceptance Criteria
- [x] QA suite passes with no JS errors.
- [ ] A fresh New Game shows no duplicate/ghost limbs in first person.
- [ ] Continue from a saved file loads into terrain, not a blue/empty view.
- [ ] All model-like objects use toon materials or intentionally documented exceptions.
- [ ] Enemy attacks have a visible pre-hit telegraph of at least 350ms.
- [ ] Boss attacks have distinct silhouettes: charge, slam, shockwave, summon, teleport.
- [ ] Hotbar, dropped item, held item, and crafting preview all match for at least 15 core items.
- [ ] SFX and music reinforce the pastel cel-shaded adventure tone without becoming harsh, muddy, or horror-like.
- [ ] Frame time stays below 16.7ms average at render distance 3 on the target browser.

---

## Future Massive Expansion — Fusion, Body Swap & Alternate Realities

> This is a long‑term expansion roadmap for transforming Inner Wilds into a dimension‑hopping entity‑fusion sandbox. Not part of the current sprint — planned for post‑v1.0.

### Fusion Mechanic
- [ ] **Fuse with any entity**: Craftable "Fusion Anchor" item. When activated on a creature/NPC/monster, the player fuses with it.
- [ ] **Model takeover**: Player model becomes the fused entity's model.
- [ ] **Attack pattern swap**: Attack moves, speed, reach, and damage type change to match the fused creature.
- [ ] **Ability inheritance**: Fused creature's special abilities (flight, swimming, burrowing, ranged attack, shield, etc.) become the player's.
- [ ] **Visual fusion indicator**: Player retains a subtle aura/particle effect showing the original pendant/tether, so identity is readable.
- [ ] **Status/stat merge**: HP, hunger, temperature, and resolve merge with the creature's natural stats.
- [ ] **De-fusion**: Using the Fusion Anchor again on yourself or an un-fuse station reverts to original form.

### Body Swap Mechanic
- [ ] **Craftable "Soul Swapper"**: Special late‑game item (recipe: pendant shard + mirror heart + void crystal).
- [ ] **Target any entity**: Activate the Soul Swapper on any creature, NPC, monster, or even another player/AI agent.
- [ ] **You become the target**: Camera and controls shift to the target's body. Player model becomes that entity's model.
- [ ] **AI takes your old body**: Your original body becomes an autonomous AI agent controlled by the game. It wanders, defends itself, and uses your old inventory.
- [ ] **Inventory stays behind**: Only the Soul Swapper moves to the new body's hotbar. All other items, blocks, and resources remain in the old body.
- [ ] **Old body is hostile or neutral**: The AI‑controlled old body may be friendly, indifferent, or hostile depending on the entity you swapped into.
- [ ] **Swap back**: Use the Soul Swapper on your old body to return. The AI returns to its original entity.
- [ ] **Perma‑death risk**: If your old body dies while you're in a swapped form, the items are lost forever (or dropped at death site).

### New Entity Classes

#### Mythological Creatures
- [ ] **Phoenix**: Fire bird, flight, healing aura, resurrects once after death.
- [ ] **Kraken**: Sea titan, tentacle grab, whirlpool, deep‑sea movement.
- [ ] **Golem**: Stone construct, slow but massive damage, immune to knockback, can break any block.
- [ ] **Wisp**: Ethereal light being, phases through blocks, heals allies, reveals hidden paths.
- [ ] **Dragon**: Flying, fire breath, scales reduce damage, rare island guardian spawn.

#### Paranormal Entities
- [ ] **Spectre**: Ghost that spawns at high temporal debt; can possess other creatures. Only visible during time stop.
- [ ] **Poltergeist**: Invisible until it attacks; throws blocks and items at the player; can be detected by shimmer in the air.
- [ ] **Void Walker**: Spawns from deep underground; teleports behind the player; slows time around itself.
- [ ] **Echo**: A memory echo of a dead creature that repeats its last actions; can be fused with for unique ghost‑phase abilities.

#### Aliens & Extradimensional Beings
- [ ] **Void Drifter**: Alien entity from between dimensions; floats and glitches; swaps position with the player.
- [ ] **Star‑born**: Crystalline being from the moon; shoots light beams; splits into smaller shards on death.
- [ ] **Phase Shifter**: Exists in two dimensions at once; attacks have a delayed echo that hits 1s later in the same spot.
- [ ] **Observer**: Silent alien that only moves when not looked at; studying it unlocks new crafting recipes.

### Alternate Realities & Dimensions
- [ ] **Mirror Dimension**: Enter via rare mirror surface anomalies. Everything is flipped left‑right. Enemies have mirrored attack patterns. Loot is mirrored (torches become cold lights, food becomes poison).
- [ ] **Void Realm**: Fall below the world or trigger a time anomaly. Pitch black except for entity glows. Gravity is lower. Time is frozen. Only entities that exist outside time (Wraiths, Spectres) appear here.
- [ ] **Overgrown Era**: The same island centuries later. Jungle covers everything. New hostile plant creatures. Rare ancient technology buried under vines.
- [ ] **Ash Era**: Post‑cataclysm version. The sky is orange, the sea is black. Only fire‑adapted creatures survive. Loot is scarce but powerful.
- [ ] **Frozen Era**: The islands were pulled into polar orbit. Everything is ice‑covered. Movement is slippery. Creatures have ice armour. Heat sources are precious.

### Parallel Universe Player Versions
- [ ] **Prime Self**: The current player — baseline.
- [ ] **Corrupted Self**: Evil version that hunts you across dimensions. Uses your own tactics. Drops a unique "Corrupted Shard" that unlocks dark fusion abilities.
- [ ] **Echo Self**: Ghost of a past playthrough (loaded from an old save slot). Repeats your old movements as an NPC. Can be swapped with via Soul Swapper for a memory walk.
- [ ] **Void Self**: Alien version that never returned from a void jump. Attacks with tentacle arms. Can be fused with for void‑phase movement.
- [ ] **Titan Self**: Giant version found only in the Titan Dimension (celestial‑scale map). You are block‑size compared to normal entities being miniature.

### Colossal Titans
- [ ] **Stone Titan**: Half‑island, half‑creature found sleeping in the sea. Wake it to trigger a floating boss arena on its back.
- [ ] **Storm Titan**: Flying cloud‑giant that circles the archipelago. Lightning strikes mark its location. Ride the storm to board it.
- [ ] **Void Titan**: Dwells in the space between islands if you fall too far. Gigantic tentacle arms that can be climbed like terrain.
- [ ] **Clockwork Titan**: An ancient machine buried inside the main island. Its gears are dungeons. Activating it reshapes the island.

### Fusion / Body Swap Progression Gate
- [ ] **Fusion Anchor**: Crafted mid‑game (iron + amber + mirror shard + pendant fragment). Basic fusion with small creatures.
- [ ] **Greater Fusion Anchor**: Upgrade requiring boss drops. Enables fusion with large creatures and minor mythologicals.
- [ ] **Soul Swapper**: Late‑game craft (greater anchor + void crystal + time anomaly core). Enables full body swap.
- [ ] **Dimension Key**: Ultra‑late‑game. Opens portals to alternate realities. Crafted from materials gathered across all eras.

### Expert Recommendation
Do not add more systems before this sprint lands. The game already has enough systems to feel rich; the next jump in perceived quality comes from art consistency, animation readability, and interaction polish. A player will forgive simple mechanics if every action looks intentional. They will not forgive beautiful terrain paired with placeholder character/item models.

---

## Answered TODO List — What To Do Next

### 1. Cel-shade the rest of the game
- [x] Convert all `MeshStandardMaterial` character/item materials to `modelMat()` unless the material needs special transparency, emissive glow, or water-like behavior.
- [x] Add a `toonMat(color, opts={})` helper that wraps `MeshToonMaterial`, `gradientMap:getToonGradient()`, texture generation, emissive handling, and optional outline metadata.
- [x] Audit every model factory: `humanoid()`, `makeMonster()`, `makeBoss()`, `makeAnimal()`, `makeWaystone()`, `buildBoatModel()`, `buildFirstPersonHands()`, `updateHandItem()`, `spawnDroppedItem()`.
- [x] Add a self-test that traverses `agents`, `playerModel`, `boatModel`, and dropped item meshes to ensure model materials are toon materials.
- [ ] Keep block terrain cel-shading flat and readable; do not over-outline every voxel face.

### 2. Fix and improve first-person/third-person limbs
- [x] Keep the v0.6.0 single-pass viewmodel approach unless a GPU-specific bug resurfaces.
- [ ] Reduce first-person arm count visually: forearm + hand + thumb is enough; upper sleeve can be shortened or hidden below screen edge.
- [x] Add a first-person "rest pose" where hands sit lower and farther apart when idle.
- [x] Add distinct poses for mining, sword swing, bow draw, eating, placing blocks, rowing boat, holding torch, and interacting.
- [x] Mirror first-person actions in the third-person player model so another camera angle reads the same action.

### 3. Enemy attack animations
- [x] Hollowling bite/claw: crouch wind-up, shoulders pull back, arms snap forward, head lunges, 500ms recovery.
- [x] Hollowling chase: forward lean, uneven arm swing, head bob synced to step rhythm.
- [x] Hollowling flee: turn torso away but head glances back, arms raised defensively.
- [ ] Surveyor Echo swipe: map-panel flicker, arm blade extension, side slash arc.
- [x] Hollow Surveyor charge: compass halo narrows, body leans forward, panels trail behind, dust/energy trail follows.
- [x] Hollow Surveyor slam: hover upward, arms lock, warning ring expands on ground, slam impact creates shockwave ring.
- [x] Hollow Surveyor teleport: panels fold inward, silhouette collapses to a point, reappears with reversed panel unfold.
- [x] Add animation state fields to agent data: `animState`, `animT`, `attackWindup`, `attackActive`, `attackRecovery`, `lastAttackType`.
- [x] Damage should only happen during the active-hit window, never at the start of wind-up.

### 4. Better item models
- [ ] Replace generic item cubes with `makeItemModel(type)`.
- [ ] Tools: pickaxe, axe, sword, shovel, hoe should be assembled from box/cylinder primitives with toon materials.
- [ ] Weapons: sword gets blade, guard, grip, pommel; bow gets curved limbs, string, arrow notch; arrows get shaft, fletching, tip.
- [ ] Consumables: berries, stew bowl, potion bottle, cooked food, raw food each need distinct silhouettes.
- [ ] Materials: ore chunks, amber, mirror shards, iron ingot, crystal fragments should use faceted low-poly geometry.
- [ ] Utility items: torch flame, bedroll straps, boat icon/model, map scroll, waystone shard.
- [ ] Drops should hover/rotate with a soft toon rim glow so pickups are visible without looking like UI sprites.
- [ ] Inventory and crafting should render either the same model on a mini canvas or a consistent hand-drawn SVG/icon generated from item metadata.

### 5. UI/UX polish
- [ ] Add a modern quest tracker toggle: compact mode, full journal mode, and hidden mode.
- [x] Add contextual action prompts: `E Talk`, `E Study`, `Right-click Place`, `Hold Left Mine`.
- [x] Add boss intro card and boss health bar with phase tick marks.
- [x] Add attack warnings that are readable without sound: rings, directional arrows, color pulses.
- [x] Add item pickup feed showing icon + count.
- [x] Add save feedback: "Saved World 1 · 12:45 PM · v0.6.0".
- [ ] Add graphics quality settings: Toon Quality, Outline Strength, Particles, Render Scale, Shadows/Fake Shadows.
- [ ] Add accessibility: reduce motion, colorblind-safe meters, subtitle captions for boss lines, key rebinding.

### 6. Story, environment, and worldbuilding
- [ ] Add a clear Act I path: wake → gather → craft torch → meet Cartographer → restore first waystone.
- [ ] Add environmental lore tablets near ruins, boss arena, and satellite islands.
- [ ] Add unique silhouettes to each island so players can identify them from far away.
- [ ] Add micro-landmarks: fallen bridge, broken observatory, amber quarry, mirror beach, mosswood grove, ash shrine.
- [ ] Give each biome one mechanic: amber stores heat, mirror reflects moonlight, ash damages bare feet unless boots, moss heals resolve, fog hides creatures.
- [ ] Add Cartographer dialogue after major milestones so the world reacts to player progress.
- [ ] Add Surveyor memory fragments after each boss phase or death.

### 7. High FPS and performance
- [x] Add a lightweight FPS meter in dev/test mode.
- [x] Add `renderer.info.render.calls`, triangle count, geometries, textures, and chunk mesh count to the QA panel.
- [x] Pool geometries/materials for items, drops, particles, and agent body parts.
- [x] Keep all new models under strict primitive budgets: normal item under 12 meshes, enemy under 30 meshes, boss under 80 meshes.
- [x] Convert repeated model details to `InstancedMesh` where possible: grass, flowers, fireflies, rain, dropped shards, boss particles.
- [x] Add dynamic render scale if average frame time exceeds target for 3 seconds.
- [x] Dirty chunks rebuild immediately on block change (few per frame, small spikes); new-chunk builds spread 8/frame via existing `chunkBuildQueue`.

### 8. Sound design and music
- [x] Define a named pastel cel-adventure sound palette so future SFX do not drift back to generic bleeps/noise.
- [x] Replace core action SFX with wood-pop placement, crystal mining chips, pentatonic pickup sparkles, water shimmer, softer footsteps, and warmer hit impacts.
- [x] Add adaptive music color-layer metadata for day, night, weather, and danger states.
- [ ] Add biome-specific ambient beds: mosswood insects, amber heat shimmer, mirror-rain glass tones, ash wind, and void-island air.
- [ ] Add boss-specific musical stingers for phase changes, teleports, slams, and defeat.
- [ ] Add UI sound states: inventory open/close, craft success, craft blocked, quest update, save complete, and low-health warning.
- [ ] Add accessibility controls: mute music, mute SFX, reduce high-frequency sparkle, and captions for major audio cues.
- [ ] Add a compact audio QA panel that shows current music danger level, weather layer, active ambience, and last SFX event.

### 9. Expert additions after v0.7.0
- [ ] Add a proper title-screen camera flyover around the cel-shaded island.
- [ ] Add a bestiary unlocked by observing/fighting creatures.
- [ ] Add a small prologue/tutorial sequence with no text walls.
- [ ] Add meaningful equipment choices: torch warmth vs shield defense vs bow range.
- [ ] Add a "found footage map" style journal that draws islands as you explore them.
- [ ] Add one vertical slice dungeon on a satellite island before adding more islands.
- [ ] Add one polished boss arena interaction, such as reflecting Surveyor beams with mirror blocks.
- [ ] Add end-of-day recap: items gathered, creatures defeated, waystones restored, distance traveled.

---

### I. CRITICAL BUGS & STABILITY

#### 1. Viewmodel Limb Ghosting (MOSTLY RESOLVED IN v0.6.0)
- [x] Replaced unstable two-pass overlay with single-pass viewmodel rendering.
- [x] Viewmodel materials are depth-safe and use high `renderOrder` so hands draw on top without duplicating below the real arms.
- [x] Added self-tests around restored jump/death/visual regressions in the v0.6.0 branch.
- [ ] Add screenshot comparison around first-person idle pose, mining pose, and sword swing pose.
- [ ] Add a fallback setting: `Viewmodel Mode = Single Pass / Overlay Pass / Hidden` for debugging GPU-specific artifacts.
- [ ] Simplify visible arm geometry to prevent the intended sleeve/forearm/hand parts from reading as duplicate limbs.

#### 2. Save-Load Robustness
- [x] Fixed: missing `spawnPoint()` function causing crash on death/load with hp=0
- [x] Fixed: `spawnDroppedItem` argument order in `respawn()`
- [x] Fixed: hp guard in `loadGame()` clamps to 1 if save contains hp <= 0
- [ ] Add save data version migration system (current v1 → v2 with additional fields)
- [ ] Validate save data integrity (checksum or field-type checking)
- [ ] Fallback to autosave if main save is corrupted

#### 3. Collision Edge Cases
- [ ] Player can sometimes fall through water surface at high velocity
- [ ] Boat collision with terrain can clip player through blocks
- [ ] Dropped items can fall through floor at chunk boundaries
- [ ] Boss can push player through arena pillars

---

### II. GRAPHICS & RENDERING

#### 4. Lighting Overhaul
- [ ] **Deferred or multi-pass lighting**: Currently all lighting is baked into vertex colors. Add dynamic shadow mapping for sun/moon and torch light
- [ ] **Shadow mapping**: PCF soft shadows for directional light (sun/moon), cascaded for large world
- [ ] **Point light shadows**: For placed torches, held torch, boss arena center
- [ ] **Ambient occlusion**: SSAO post-process or baked AO in chunk meshes (higher-resolution AO pass)
- [ ] **Volumetric fog**: Layered fog with height falloff, god rays through fog at dawn
- [ ] **Bloom post-process**: UnrealBloomPass for torch glow, boss energy, waystone activation
- [ ] **Tone mapping**: Current ACESFilmic is good; add exposure auto-adjustment based on time of day
- [ ] **HDR rendering**: Float render targets for better light accumulation

#### 5. Terrain & Environment
- [ ] **Better terrain noise**: Multi-octave domain-warped simplex noise with 3D caves and overhangs
- [ ] **Cave systems**: Underground tunnels, caverns, ore seams, underground water, glowing crystal formations
- [ ] **Floating islands**: Small island fragments above the main terrain, reachable by climbing/jumping
- [ ] **Custom trees**: Procedural trunk+branches+canopy with Three.js tree generation (not just blocks)
- [ ] **Improved water**: Refraction shader, shoreline foam particles, underwater caustics, animated wave normal maps
- [ ] **Weather effects**: Rain particle system (thousands of particles), snow, fog density variation, wind on grass/foliage
- [ ] **Clouds**: 3D cloud layer (sprite cloud cards or volumetric raymarched clouds) that cast shadows
- [ ] **LOD system**: Distance-based chunk mesh detail levels (far chunks use merged low-poly geometry)
- [ ] **Ocean beyond islands**: Animated infinite ocean plane with vertex shader waves, visible from high ground
- [ ] **Underwater**: Caustic light patterns, depth fog, different ambient color, muffled audio

#### 6. Block & Item Visuals
- [ ] **PBR block textures**: Metalness/roughness/emissive maps per face on relevant blocks
- [ ] **Animated textures**: Lava glow pulse, water ripple on surface, torch flame animation
- [ ] **Connected textures**: Grass/dirt transition, ore veins that connect across adjacent blocks
- [ ] **Block breaking animation**: Crack texture overlay with damage stages (Like Minecraft's break progression)
- [ ] **Item model viewer**: 3D item preview in inventory tooltip / crafting result slot
- [ ] **Enhanced tools**: 3D toon models (pickaxe, axe, sword, bow, torch, bedroll) with tier-specific materials and colors
- [ ] **Unified item model pipeline**: One `makeItemModel(type)` factory reused by first-person hands, third-person avatar, drops, hotbar/crafting preview, and inventory tooltip
- [ ] **Pickup readability**: Dropped items should float, rotate, squash slightly on landing, and use a subtle rim glow
- [ ] **Durability bar**: Visual wear indicator on tools and armor in hotbar

#### 7. Character & Creature Models
- [ ] **Player model rig**: Toon-material body with pivot joints for walk, run, jump, swim, mine, swing, eat, place, bow draw, and sword slash
- [ ] **First-person body**: Show legs/body when looking down in first-person view
- [x] **Hollowling redesign**: Glowing eye slits, crystalline growths, translucent body showing internal lights
- [x] **Surveyor redesign**: Floating brass-and-stone frame, articulated compass arms, orbiting map panels with glowing arcana
- [ ] **Animal variants**: Multiple Glass Elk color morphs, Lantern Hare seasonal coat changes
- [ ] **Damage flash**: Model tint shift + emission on hit
- [ ] **Attack animation library**: Shared animation state machine for wind-up, active-hit, recovery, stagger, death, flee, idle, patrol, and chase
- [ ] **Death animations**: Ragdoll (simple) or disintegration particles per creature type
- [ ] **Agent LOD**: Far agents render as simple sprite billboards

#### 8. UI & HUD
- [ ] **Crosshair**: Refined dynamic crosshair — expands when mining, shows break progress ring, damage hit marker
- [ ] **Health bar**: Stylized hearts/bar with damage vignette overlay, heal glow
- [ ] **Hunger / temperature / resolve**: Doughnut-ring gauges around health bar, or compact vertical side meters
- [ ] **Hotbar**: Improved slot styling with durability bar, cooldown overlay, enchantment glint
- [ ] **Inventory**: Grid-based with drag-to-rearrange, category tabs, search filter
- [ ] **Crafting**: Recipe tree view, show/hide uncraftable recipes, favorite/bookmark system
- [ ] **Compass**: Top-of-screen compass strip showing N/S/E/W, marked waypoints, boss indicator
- [ ] **Minimap**: Bottom-right corner, top-down rendered chunk view with player/target markers
- [ ] **Quest log**: Full-screen journal with completed quest history, lore entries, bestiary
- [ ] **Dialogue**: Portrait art for speakers, typewriter text animation, branching dialogue tree
- [ ] **Boss health bar**: Prominent top-center bar during boss fight with phase indicators
- [ ] **Damage numbers**: Animated floating text with damage type color, crit indication, healing in green
- [x] **Toast system**: Stacking bottom-left notifications with slide-in animation across general, pickup, and time messages
- [ ] **Notification tray**: Inbox for quest updates, discoveries, system messages
- [ ] **Settings**: FOV slider, brightness/gamma, mouse sensitivity separate X/Y, volume mixers (master/music/sfx/ambient), render distance (2-12), quality preset (low/medium/high/ultra), key binding remapping, accessibility options
- [ ] **Save slot UI**: Per-slot screenshot preview, world age, play time, delete confirmation
- [ ] **Loading screen**: Animated island render, tip rotation, progress bar with stage labels
- [ ] **Main menu**: Animated background (orbiting waystones or island fragment rotation)

---

### III. GAMEPLAY SYSTEMS

#### 9. Combat Overhaul
- [ ] **Melee combos**: Click-timing combo chains (3-sword combo with increasing damage)
- [ ] **Blocking**: Right-click with shield to block damage, stamina drain
- [ ] **Dodge roll**: Double-tap movement key for invincibility-frame dodge
- [ ] **Ranged combat**: Craftable bow and arrows, arrow physics (gravity, falloff), different arrow types
- [ ] **Magic**: Craftable staves with elemental spells (fireball, ice spike, lightning bolt, heal)
- [ ] **Status effects**: Poison (damage over time), Slow, Stun, Burn, Frozen, Cursed
- [ ] **Critical hits**: Hit from behind or while target is unaware = 2x damage
- [ ] **Weak points**: Specific body parts take more damage (Hollowling head, Surveyor core)
- [ ] **Parry**: Well-timed block before melee hit = stun enemy, open to counter-attack
- [ ] **Knockback physics**: Weight-based knockback resistance, environmental collision damage

#### 10. Survival Systems
- [ ] **Thirst**: Separate water meter, fresh water (rain collection, rivers) vs salt water (oceans dehydrate)
- [ ] **Disease**: Dirty water/food can cause illness, craftable medicines from found herbs
- [ ] **Oxygen**: Underwater breath timer, air bubbles from underwater plants, snorkel/scuba gear
- [ ] **Stamina**: Sprint, jump, attack, and dodge consume stamina; regens when idle
- [ ] **Rest**: Sleep in bedroll fully restores, sitting by fire partially restores resolve
- [ ] **Temperature depth**: Four layers (hyperthermia → warm → cool → hypothermia) with progressive effects
- [ ] **Seasonal cycle**: Long-term season system (30 day cycles) affecting temperature, day length, weather patterns, foliage color
- [ ] **Crop farming**: Till soil, plant seeds, water, wait for growth, harvest for renewable food
- [ ] **Animal husbandry**: Capture and breed animals for food and materials
- [ ] **Cooking**: Campfire and furnace recipes with ingredient combinations and quality tiers

#### 11. Progression & Equipment
- [ ] **Tool tiers**: Wood → Stone → Iron → Gold (fast but weak) → Diamond → Netherite-style endgame
- [ ] **Enchanting**: Enchantment table with XP system, randomized enchant options
- [ ] **Potion brewing**: Stand with ingredients, water bottles, nether wart base, secondary ingredients for effects
- [ ] **Armor set bonuses**: Full set grants special ability (e.g., full leather = silent movement, full iron = knockback resist)
- [ ] **Accessory slots**: Ring, amulet, belt, cape — each with minor passive bonuses
- [ ] **Backpack**: Craftable backpack expands inventory capacity
- [ ] **XP / skill levels**: Earn XP from mining, combat, crafting, exploration; spend on enchantments or skill tree
- [ ] **Skill tree**: Three branches — Survival (better food, faster healing), Combat (melee/ranged/magic bonuses), Crafting (unlock recipes, quality bonuses)

#### 12. Boss & Enemies
- [ ] **More bosses**: Each satellite island has a unique boss — the Amber Warden (golem), the Mistweaver (phantom), the Ashen King (fire elemental), the Crystal Guardian (Glasslight Key)
- [ ] **Boss mechanics per phase**: Each boss has 3+ distinct phases with unique attack patterns, arena hazards, enrage timers
- [ ] **Minion variety**: Hollowling variants — brute (slow + heavy), scout (fast + frail), shaman (ranged + healing), sentinel (high HP + shield)
- [ ] **Night-only enemies**: Shadow wraiths, will-o-wisps that lead you off cliffs, nightmare phantoms
- [ ] **Environmental hazards**: Lava pools, quicksand, thorn bushes, ice patches, poisonous gas vents
- [ ] **Boss rewards**: Unique crafting materials, new block types, lore tablets, access to locked areas
- [ ] **Arena design**: Each boss arena has unique geometry, hazards, and interactive elements

#### 13. Exploration & World
- [ ] **Waystone network**: All 6+ waystones, when activated, create fast-travel points between islands
- [ ] **Treasure maps**: Cartographer gives you maps showing hidden structure locations
- [ ] **Ruins**: Procedurally generated stone structures with loot chests, spawners, puzzles
- [ ] **Puzzles**: Lever/door puzzles, pressure plate sequences, light-reflection puzzles using waystone energy
- [ ] **Abandoned camps**: Lore-filled campsites with journals, half-built projects
- [ ] **Underwater ruins**: Sunken structures accessible with underwater gear
- [ ] **Peak viewpoints**: Highest point on each island reveals nearby points of interest
- [ ] **Trading**: Cartographer trades maps for materials, other NPCs trade unique items
- [ ] **World events**: Random events — meteor shower (rare resources), Hollowling migration, aurora borealis at night

#### 14. Multiplayer Foundation
- [ ] **WebRTC peer-to-peer**: Basic multiplayer with position syncing, shared world state
- [ ] **Server-authoritative combat**: Prevent cheating with server-side hit validation
- [ ] **Shared chunks**: Chunk ownership transfer, load balancing between peers
- [ ] **Voice chat**: Proximity-based WebRTC audio
- [ ] **Co-op boss fights**: Multiple players in the Surveyor arena, shared aggro

---

### IV. AUDIO

#### 15. Music
- [ ] **Dynamic soundtrack**: Adaptive music system that layers instruments based on context — calm exploration, combat intensity, boss phase, underwater
- [ ] **Original score**: Composed thematic tracks per biome (amber desert strings, ice island chimes, ash plains drums)
- [ ] **Boss themes**: Unique track per boss with phase transitions (Phase 2 adds brass, Phase 3 adds choir)
- [ ] **Night music**: Softer, more mysterious arrangement with distant howls
- [ ] **Weather-reactive music**: Rain adds soft percussion, fog muffles the mix, wind adds airy pads
- [ ] **Menu theme**: Title screen ambient track
- [ ] **Victory fanfare**: Short sting on quest completion, boss defeat, waystone activation

#### 16. Sound Effects
- [ ] **Spatial audio**: All world sounds use PannerNode for 3D positioning (footsteps, mining, creatures, water, weather)
- [ ] **Footsteps**: Material-dependent footstep sounds (grass→soft, stone→hard, water→splash, wood→creak)
- [ ] **Mining**: Per-block-type break sounds (stone→chisel, dirt→shovel, wood→axe, ore→metallic ping)
- [ ] **Placement**: Satisfying thunk sound per block type
- [ ] **Item pickup/drop**: Short rising/chiming feedback
- [ ] **Inventory**: Paper rustle, equipment equip/unequip
- [ ] **Combat**: Sword swoosh, hit impact (per material), block clang, parry ring
- [ ] **Boss**: Surveyor's mechanical hum, charge warning sound, teleport warp sound, shockwave boom
- [ ] **Ambient**: Wind depending on altitude/weather, insect chirps at dusk, distant Hollowling groans
- [ ] **Underwater**: Muffled filter on all sounds, heartbeat when oxygen low, bubble sounds
- [ ] **UI clicks**: Soft click/hover feedback for all interactive elements
- [ ] **Weather**: Rain intensity layers, thunder rumbles, wind gusts

---

### V. PERFORMANCE & OPTIMIZATION

#### 17. Rendering Optimization
- [ ] **Frustum culling**: Skip rendering chunks outside camera view (Three.js already does this per-mesh, but chunk-level culling reduces draw calls)
- [ ] **Occlusion culling**: GPU-based occlusion queries for chunks behind terrain
- [ ] **LOD chunks**: Far chunks use simplified mesh (merge faces, reduce vertex count)
- [ ] **Instanced blocks**: High-density blocks (dirt/stone) at distance render as instanced mesh
- [ ] **Texture atlas**: Current atlas works, but compress to fewer larger tiles with mipmaps
- [ ] **Reduce draw calls**: Merge all visible chunk meshes into a single geometry per frame when no blocks change
- [ ] **GPU instancing for foliage**: All grass/flowers as a single InstancedMesh, same for all butterflies/fireflies
- [ ] **Greedy meshing optimization**: Current algorithm is O(n³); optimize with chunk-level skip if no block changes
- [ ] **Async chunk generation**: Web Worker for terrain height and block data generation (but Three.js mesh creation must stay on main thread)
- [ ] **Async mesh creation**: Deferred mesh creation queue, process 1-2 chunks per frame to avoid hitches
- [ ] **GLB/GLTF export for static parts**: Pre-generate island terrain as optimized glb, stream-load on init

#### 18. Memory Management
- [ ] **Chunk unload**: Unload mesh and data for chunks beyond render distance + margin
- [ ] **Texture atlas garbage collection**: Remove unused block textures from atlas when no blocks of that type are loaded
- [ ] **Geometry pooling**: Reuse chunk geometries when rebuilding (mark dirty, update in place)
- [ ] **Audio buffer pooling**: Limit simultaneous sounds, recycle AudioBufferSourceNode instances
- [ ] **Dropped item limit**: Global cap on concurrent dropped items, despawn oldest/farthest first
- [ ] **Particle limit**: Strict particle count cap, recycle particle objects
- [ ] **Agent count cap**: Maximum creatures loaded at once, despawn distance-based

#### 19. Frame Rate Targets
- [ ] **60 FPS on mid-range (2020+)**: Full terrain, lighting, particles, audio, 6 chunk render distance
- [ ] **30 FPS on low-end laptops**: Reduced particle count, 4 chunk distance, simple water, no dynamic shadows
- [ ] **120 FPS on high-end desktops**: Max settings, 12 chunk distance, shadows, bloom, volumetric fog
- [ ] **Detect capability**: Auto-detect GPU/driver capability and set quality preset
- [x] **Dynamic resolution**: Scale render resolution down when framerate drops below target
- [ ] **Progressive loading**: Stream chunks nearest-first, render placeholder fog for unloaded areas

#### 20. Network & Asset Loading
- [ ] **Three.js CDN caching**: Service worker for CDN assets, fallback to local cache
- [ ] **Texture preload**: Generate all block textures during loading screen, not lazily on first block view
- [ ] **Audio preload**: Pre-decode sound effect buffers during init
- [ ] **Split file**: Core engine + deferred assets (music files, high-res textures loaded after first render)

---

### VI. UI & USER EXPERIENCE

#### 21. Visual Polish
- [ ] **Animations**: Smooth transitions for panel open/close, toast slide-in, hotbar item pop-in
- [ ] **Translucency**: Glass panel backgrounds with backdrop blur where supported
- [ ] **Icon set**: Custom SVG icons for all item types, status effects, UI actions
- [ ] **Tooltips**: Rich hover tooltips on all items showing stats, description, recipe source
- [ ] **Key hint badges**: Context-sensitive key hints near interactive elements ("E to talk", "F to center")
- [ ] **Notification badges**: Red dot on new quests, unread journal entries, craftable recipes
- [ ] **Color theming**: Light/dark mode toggle, optional high-contrast mode for accessibility

#### 22. Accessibility
- [ ] **Remappable keys**: Full keyboard binding UI with conflict detection
- [ ] **Controller support**: Gamepad API for movement, camera, actions — dual-stick + triggers
- [ ] **Colorblind modes**: Protanopia/deuteranopia/tritanopia filter on UI and world
- [ ] **Subtitle system**: All dialogue, NPC speech, boss taunts subtitled with speaker name
- [ ] **Screen reader**: ARIA labels on all interactive elements, live region for toasts
- [ ] **Motion reduction**: Option to reduce camera bob, screen shake, particle effects
- [ ] **Font scaling**: UI text size options
- [ ] **Auto-mine toggle**: Hold-to-mine vs click-to-mine setting
- [ ] **Invert Y**: Separate mouse and controller invert options

#### 23. Mobile Support
- [ ] **Virtual joystick**: Left-side movement joystick, right-side camera drag
- [ ] **Tap-to-mine**: Tap blocks to mine, hold for auto-mine
- [ ] **Touch UI**: Larger interactive zones, swipe to scroll inventory
- [ ] **Responsive layout**: Adapt HUD and menus to mobile aspect ratios
- [ ] **Pinch zoom**: Camera distance adjustment in third person

---

### VII. STORY & CONTENT

#### 24. Narrative Arc
- [ ] **Act I — The Waking**: Tutorial island, learn to survive, meet Cartographer, restore first waystone
- [ ] **Act II — The Archipelago**: Reach satellite islands, discover the Surveyor's history, restore more waystones
- [ ] **Act III — The Reckoning**: Confront the Hollow Surveyor, decide the island's fate (restore or shatter again?)
- [ ] **Endings**: Multiple endings based on choices (who you trusted, which waystones you restored, whether you defeated or reasoned with the Surveyor)

#### 25. Characters
- [ ] **The Cartographer**: Full backstory — they were the Surveyor's apprentice. They can teach you to read the island's memory.
- [ ] **The Hollow Surveyor**: Boss dialogue evolves per phase. Phase 1: route commands. Phase 2: fragmented memories. Phase 3: their true name, a plea.
- [ ] **The Glass Elk**: Ancient spirit of the mirror biomes. If you earn its trust, it guides you through the fog.
- [ ] **The Lantern Hare**: Frightened creature that collects lost light. Follow it to hidden areas.
- [ ] **Amberreach Hermit**: An old Hollowling who refused the Surveyor's call. Sells rare maps in exchange for amber.
- [ ] **Misthold Watcher**: A ghostly figure who appears only in fog. Gives cryptic warnings about the Surveyor.

#### 26. Lore & Worldbuilding
- [ ] **The Shattering**: Full backstory — the civilization tried to crystallize all memory into a single waystone, the island couldn't bear the weight
- [ ] **Memory crystal texts**: Scattered collectible texts that reveal history, recipes, poetry from the old civilization
- [ ] **Bestiary**: Unlockable creature entries with lore, habitat, drops, behavior notes
- [ ] **Environmental storytelling**: Ruined buildings tell a story through their layout — residential, workshop, temple, observatory
- [ ] **Seasonal events**: In-game calendar holidays tied to the island's history

#### 27. Content Volume Targets
- [ ] **Block types**: 80+ unique blocks with distinct textures and behaviors
- [ ] **Item types**: 120+ items (tools, weapons, armor, food, potions, materials, artifacts)
- [ ] **Recipes**: 80+ craftable recipes including multi-stage processing
- [ ] **Quests**: 30+ quests across all acts, including optional side quests and repeatables
- [ ] **Journal entries**: 50+ lore entries, 20+ creature bestiary entries
- [ ] **Achievements**: 40+ achievements with unlock tracking and toast notifications
- [ ] **Dialogue**: 500+ lines of dialogue across all NPCs, branching responses
- [ ] **Music tracks**: 15+ original compositions, adaptive stems

---

### VIII. TECHNICAL DEBT & ENGINE

#### 28. Code Quality
- [ ] **Split into modules**: Separate concerns into logical files (world.js, player.js, combat.js, ui.js, audio.js, etc.) with ES module imports
- [ ] **TypeScript migration**: Add JSDoc types first, then migrate to .ts with incremental adoption
- [ ] **Unit tests**: Jest/Playwright unit tests for core systems (collision, inventory, crafting, quest state machine)
- [ ] **Integration tests**: Automated gameplay scenarios — start game, mine block, craft item, talk to NPC, defeat agent
- [ ] **Performance benchmarks**: Automated FPS measurement, memory usage tracking, draw call counting
- [ ] **Error handling**: All external inputs validated, graceful degradation on unsupported features
- [ ] **Logging**: Structured debug logging with verbosity levels, dumpable to file

#### 29. Build & Deploy
- [ ] **Bundler**: Vite or esbuild for production builds (code splitting, tree shaking, minification)
- [ ] **Dev server**: Vite dev server with HMR for rapid iteration
- [ ] **CI/CD**: GitHub Actions for automated testing on PR, deploy to GitHub Pages or Netlify
- [ ] **PWA**: Service worker for offline play, install prompt, asset caching
- [ ] **WebGL fallback**: WebGL1 support for older devices, auto-detect and degrade gracefully
- [ ] **CDN versioning**: Three.js version pinned with integrity hash for security and reproducibility
- [ ] **Godot web-export spike**: Before any engine migration, prove a tiny Godot 4 scene exports to Web, runs in Chromium/Firefox, captures mouse input, plays audio after a user gesture, persists a save, and meets a representative FPS budget

#### 30. Modding & Extensibility
- [ ] **Data-driven blocks**: Block types loaded from JSON, not hardcoded
- [ ] **Recipe pack format**: JSON recipe definitions, loadable at runtime
- [ ] **Scripting API**: Limited JavaScript API for mods to hook into game events
- [ ] **Custom block textures**: Users can provide their own texture images
- [ ] **World save export/import**: Download world as .iw file, share with others

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
- Music loop cuts: timeupdate fade
- Tunneling through ground: swept collision
- Fullscreen black bar: resize handler + CSS
- Hand visibility: repositioned, camera added to scene
- Butterfly/firefly placement: cross-plane sprites
- Jump velocity: reduced from 17 to 14
- Settings split: Music/SFX volume sliders
- Dialogue keyboard: number keys + Enter
- Celestial bodies: fog:false, depthTest, offset 180
- Camera pitch: widened to -1.55..1.55
- Mining sound: removed retro square wave
- Torch: cross-plane sprite model + PointLight
- Creature damage: all agents hittable
- Firefly illumination: increased intensity/range
- Arm redesign: bottom corners, smaller, pointing upward, depthTest removed

### Session 3 (Enhancement Prompt Pass)
- Enlarged arm/hand geometry, depthTest:false
- Third-person player model, V key toggle
- Reliable hits: matrix refresh, 6-block reach
- Torch light on placed torches
- Sun glow sprite, 2000-point starfield
- Sin-wave water animation
- Swing cooldown, knockback, damage numbers, death FX
- 3x faster hunger, 5 foods + potions, freezing slows
- 27 recipes + recipe discovery toasts
- Q drop, shift-click move, auto-sort, stack counts
- Tool-tier mining multipliers + damage
- Footstep/splash/pickup SFX
- Monster AI state machine
- Full save/load with autosave
- Loading screen with progress bar
- Anti-tunneling second pass
- Keyboard-friendly dialogue

### Session 4 — `v0.4.0` "Archipelago Update"
- Version surfaced in menu + HUD badge
- Viewmodel layer rendering (depth-cleared overlay pass)
- Blocky Hytale-style arm rig (5 parts per arm)
- Humanoid avatar with neck/shoulders/jointed limbs
- Block textures with depth: gradient, grain, bevel, ambient occlusion
- Cleaner menu: New Game / Continue / Settings / Field Notes
- Save/spawn fixes: ground clamp, anti-bury, void catch
- Journal moved to inventory (Tab) popup
- RPG-style quests with locked/active/done states
- 20-minute day/night cycle
- Archipelago world: 5 islands, island-specific terrain falloff

### Session 5 — `v0.5.0` "Boss & Survival Update"
- The Hollow Surveyor boss (3-phase, arena, shockwave/charge/teleport/slam attacks)
- Surveyor Echo minion summons
- Boss arena ring + pillars
- Death/respawn system with item drop penalty
- `spawnPoint()` function (was missing, fixed crash on death/load)
- hp guard in save loading (clamp to 1)
- `spawnDroppedItem` argument order fix in respawn
- `renderFrame()` try/finally guard for state restoration
- Version updated to v0.5.0

### Session 6 — `v0.6.0` "Cel-Shaded Update"
- Cel-shaded terrain using `MeshToonMaterial` and shared toon gradient ramp.
- Brighter sky and banded lighting for a stronger anime/adventure look.
- Single-pass viewmodel rendering with depth-safe materials and `renderOrder`, replacing the old two-pass overlay that caused ghost/crooked hands on some machines.
- Restored jump behavior and added regression self-tests.
- Added death screen and full-drop penalty tests.
- Embedded QA suite now passes **107/107**.

### Session 7 — `v0.7.0` "Character & Item Polish"
- Added shared `makeItemModel(type, scale)` factory for readable low-poly toon items.
- First-person held items, third-person held items, and dropped pickups now share the same item-model language.
- Dropped items are no longer flat sprites; they hover and rotate as 3D toon models.
- Hollowlings now telegraph attacks with wind-up, active-hit, and recovery windows.
- Hollowling attack animation moves arms/head during the attack pose, making incoming damage readable.
- Combat damage now happens during the active-hit window, not instantly on contact.
- Embedded QA remains **107/107**.

### Session 8 — `v0.7.1` "Death Drop Polish"
- Death now drops every inventory stack exactly where the player died.
- Respawn leaves the full loot pile at the death site.
- Embedded QA verifies dropped stack type/count and death-location placement.
- Embedded QA remains **107/107**.

### Session 9 — `v0.7.2` "Pastel Block Polish"
- Brightened moss, stone, sand, leaves, bark, water, amber, ember, cobble, planks, ore, flowers, and grass toward a pastel cel-shaded palette.
- Replaced muddy grayscale block texture speckling with subtle color-tinted procedural detail.
- Reduced block bevel darkness, ambient occlusion strength, bottom-face shadowing, and side-face lighting penalties.
- Added a regression self-test that guards against the terrain palette drifting back to a dark/muddy look.
- Embedded QA target is now **108/108**.

### Session 10 — `v0.7.3` "Boss Telegraph Polish"
- Added boss warning-ring infrastructure with lifecycle cleanup.
- Surveyor shockwaves and phase-three slams now create ground warning discs before resolving damage.
- Surveyor charges now create a visible lane/arrow before the dash starts.
- Boss core pulses during telegraph wind-up to make the attack read from the model silhouette too.
- Embedded QA target is now **109/109**.

### Session 11 — `v0.7.4` "Aesthetic Audio Polish"
- Added a named pastel cel-adventure SFX palette and regression coverage.
- Core action sounds now use softer wood pops, crystal chips, pentatonic pickup sparkles, water shimmer, and warm hit impacts.
- Music keeps the CC0 calm/danger loop crossfade but gains adaptive day/night sparkle, weather accents, and restrained danger pulse.
- Embedded QA target is now **111/111**.
- Remaining art gap: character models, enemies, held items, inventory/crafting previews, UI icons, and richer audio ambience still need continued polish.

### Session 12 — `v0.7.5` "Feedback UI Polish"
- Added contextual prompts for the player's current target/action so interactions read clearly without opening the controls sheet.
- Added pickup feed entries with item icons/counts for inventory confirmations.
- Added Hollow Surveyor boss health bar with phase ticks and current phase label.
- Added save feedback with world name, local time, and version.
- Embedded QA target is now **112/112**.

### Session 13 — `v0.7.6` "Performance HUD Polish"
- Added a lightweight dev/test stats HUD for FPS, frame time, draw calls, triangle count, chunks, particles, drops, geometries, and textures.
- The HUD is visible in `?test` mode and can be opted into through `localStorage.iw_dev_stats = '1'`.
- Embedded QA target is now **113/113**.

### Session 17 — `v0.10.0` "Combat Readability"
- **Impact freeze**: 80ms time dilation on every monster hit (`dt *= 0.06`), giving satisfying hitstop.
- **Slash arcs**: Sprite-based crescent arc appears in front of the camera on each swing — fades out over 0.32s with a scale-up pop.
- **Hit sparks**: Directional particle burst at the hit point — particles fly toward the player→enemy vector, brighter color (gold) for higher-damage weapons.
- **Enemy wind-up glow**: Hollowling aura rings pulse and brighten during the 0.36s telegraph phase, then dim after the strike lands.
- New embedded QA test verifies `impactFreeze`, `spawnSlashArc`, `updateSlashArcs`, and `makeSlashTexture` are wired and functional.
- Embedded QA target is now **116/116**.

### Session 18 — `v0.11.1` "Axe Chop & Guardrails"
- Full-tree chopping is now an axe ability: wooden, stone, and iron axes can cascade bark/leaf blocks above the chopped block; bare hands and non-axe tools break only one block.
- Added embedded QA coverage for axe-gated tree chopping so the behavior does not regress.
- Added low-poly performance guardrails with `MODEL_BUDGETS` and `modelPerfStats()` for item, Hollowling/Echo, and boss model factories.
- Filtered unsupported `roughness`, `metalness`, `shininess`, and `specular` options before creating `MeshToonMaterial`, removing repeated material warning spam during model creation.
- Embedded QA target is now **118/118**.

### Session 19 — `v0.11.2` "Dynamic Render Scale"
- Added adaptive render scale: if average frame time stays above budget for 3 seconds, the renderer lowers pixel ratio in 0.1 steps down to 0.6; if performance recovers, it climbs back up conservatively.
- Uses raw frame delta for performance measurement so gameplay hitstop/impact freeze cannot fake a high FPS reading.
- Dev Stats HUD now shows current render scale alongside FPS, frame time, draw calls, triangles, chunks, particles, drops, geometries, and textures.
- Added embedded QA coverage for dynamic render scale wiring and renderer pixel-ratio changes.
- Embedded QA target is now **119/119**.

### Session 20 — `v0.11.3` "Material Pooling"
- Added a shared `modelMaterialCache` for `modelMat()` so repeated item, drop, held-item, enemy, and boss model factories reuse identical `MeshToonMaterial` instances instead of allocating duplicates.
- `disposeObject()` now skips shared cached materials so temporary QA/item/drop models do not accidentally dispose global material cache entries.
- First-person viewmodel setup clones shared materials before applying `depthTest:false`/`depthWrite:false`, preserving the draw-on-top viewmodel without mutating world materials.
- Added embedded QA coverage that verifies identical item models share materials and viewmodel materials are cloned safely.
- Embedded QA target is now **120/120**.

### Session 21 — `v0.11.4` "Drop Physics & Geometry Pooling"
- Fixed bark/leaf drops snapping above trees: dropped-item collision now resolves against the nearest solid floor below the item instead of the highest solid block in the whole column.
- Tree block drops now start with zero upward velocity, so bark/leaves fall from the original block center instead of popping upward.
- Extended the axe-gated tree-chop QA to verify bark/leaf drops spawn at their original block centers and fall downward.
- Added `modelGeometryCache` plus pooled geometry helpers for item/drop model primitives (`boxGeo`, `cylGeo`, `sphereGeo`, `coneGeo`, `torusGeo`, `octGeo`, `dodecaGeo`, `planeGeo`).
- `disposeObject()` now skips shared cached geometries, matching the shared material disposal behavior.
- Embedded QA still **120/120**.

### Session 22 — `v0.11.5` "Agent Geometry Pooling"
- Converted generated agent body geometry to the shared geometry helpers: humanoids, Cartographer details, Glass Elk, Lantern Hare, Hollowlings, Surveyor boss body parts, and waystones now reuse cached primitive geometries.
- Shared helper geometry now covers `addLimb()`, eyes, shine highlights, aura rings, and repeated boss/Hollowling arm pieces.
- Added embedded QA coverage that verifies duplicate generated agents reuse shared geometries and that non-outline body meshes are backed by pooled geometry.
- Embedded QA target is now **121/121**.

### Session 23 — `v0.11.6` "Prewarmed Particles"
- Prewarmed the particle mesh/material pool to `MAX_PARTICLES` at startup so first combat, mining, boss, and death bursts reuse existing meshes instead of allocating during gameplay.
- Added `particlePoolStats` plus `createParticleMesh()` / `prewarmParticlePool()` so particle allocation is explicit and testable.
- Particle pool QA verifies the pool is prewarmed, capped, and paired with the active particle list.
- The High FPS pooling row is now complete for materials, item/drop geometry, agent body geometry, and particles.
- Embedded QA target is now **122/122**.

### Session 24 — `v0.12.0` "FPS Meter & Collision Fix"
- Added a lightweight always-visible FPS meter in the top-right corner with green/yellow/red color coding and render‑scale percentage, independent of the `?test` dev stats panel.
- Fixed collision: removed ceiling‑height check from `canStandAt()` that prevented stepping into shallow (1‑block‑deep) holes; `wouldHitCeiling()` already handles headroom relative to the player's actual Y.
- Restored `remeshDirtyChunks()` to immediate batch rebuild (dirty chunks are 1–4 during gameplay, so spreading them adds per‑frame overhead; the new‑chunk `chunkBuildQueue` remains spread 8/frame).
- Added `fpsTracker` and `updateFpsMeter()` for per-frame FPS tracking; `fpsMeter` element styled to match the HUD and hidden on narrow mobile layouts.
- QA suite extended with FPS meter, collision, and dirty-chunk checks.
- Embedded QA target is now **124/124**.

### Session 25 — `v0.13.0` "Time Pendant"
- Added **Time Pendant** (item 80) — craftable from 2 amber + 2 mirror + 1 iron ingot + 1 glow apple; model is a purple torus pendant with chain and glow core.
- Right‑click with pendant selected activates **Time Stop**: world freezes (agents, particles, day/night, water, weather), player moves freely, purple overlay fades in.
- **T key** with pendant selected opens the time menu: Stop / Rewind 5s / 30s / 60s / Forward 5s / 30s / 60s / Cancel.
- **Snapshot system**: Circular buffer of 240 snapshots taken every 0.25s, storing player pos/state, dayTime, weather, agent positions/HP/state.
- **Time Rewind**: Finds the closest snapshot to the target time and interpolates player position toward it; shows a semi‑transparent ghost player at the snapshot location.
- **Time Fast‑Forward**: Runs all world updates at 3× speed for the chosen duration.
- **Consequences**: Each pendant use increments a per‑60s counter; at 15%+ residue, temporal rifts shimmer; at 30%+, wormholes pulse; at 50%+, temporal echoes can break through.
- **FPS tweaks**: `MAX_PARTICLES` reduced from 120 to 80; chunk rebuild throttled to every 4 frames during gameplay (fast‑paths when new chunks are queued).
- Embedded QA target is now **125/125**.
- Fixed model ordering: `type===80` check now precedes generic `bt.glow` fallback (previously the pendant rendered as a default glow octahedron).

### Session 26 — `v0.14.0` "Time Anomaly"
- Added **Time Anomaly** consequence: at ≥40% temporal residue with 45s cooldown, each pendant deactivation has a chance to fling the player to a random island with a random dayTime and changed weather.
- Anomaly triggers a full‑screen purple flash, particle burst, and "TIME ANOMALY" toast to sell the disorientation.
- 45s cooldown prevents chain anomalies, keeping each one disruptive but rare.
- Embedded QA target is now **127/127**.

### Session 27 — `v0.15.0` "Iron Veins & Item Art"
- Added underground **iron ore veins** using smooth noise pockets inside stone, so iron ingots are craftable in normal gameplay.
- Made **boats and bedrolls portable deployables**: place on any solid face, mine/pick them back up, and interact with placed bedrolls to sleep.
- Fixed right-click single placement placing two blocks by setting placement cooldown immediately on pointer down.
- Reworked hotbar/inventory icons into transparent silhouette art and removed names from slots; counts now display as compact badges.
- Redrew core blocks, resources, tools, armor, food, potions, boat, bedroll, and time pendant icons so inventory identity does not depend on reading labels.
- Embedded QA target is now **131/131**.

### Session 28 — `v0.16.0` "Temporal Arrows & Persistence"
- Added **block edit persistence**: player-mined/placed voxel edits are saved as a compact journal and replayed over regenerated chunks, preserving builds across updates without freezing the whole world generator.
- Moved pickup feedback to the side art feed only; removed duplicate center pickup toasts.
- Added physical **boat nudging** and placed-boat riding via **E** when the boat is on water; moved boat positions are saved.
- Placed bedroll now renders as a rolled-out mat while inventory/drop bedroll remains rolled.
- Bow was moved to physical projectiles instead of instant hits; current controls use **LMB hold/release** for draw and fire.
- **Temporal arrows**: arrows fired during Time Stop hang in mid-air and resume flight when time resumes.
- Time Pendant fixes: sleep is blocked during stopped time, resume dialogue closes correctly, and pause/resume requires the pendant selected.
- Added context prompts for Time Pendant controls and documented a major future roadmap for self-paradoxes, time wraiths, era travel, and alternate universes.
- Embedded QA target is now **137/137**.

### Session 29 — `v0.17.0` "Berry Bushes & Death Compass"
- Nerfed **hunger drain** by ~50%: base drain 0.38/60s (was ~0.75), sprint 1.42/60s (was ~2.8); survival feels paced, not punishing.
- Added **berry bushes** (block 16): generate in small clusters on grassy terrain; harvest for 2–3 berries each.
- Added **Death Compass** (item 81, recipe: 3 iron ingots + 1 glow apple + 1 mirror): tracks last death position; current implementation points the held model needle at the death spot without an on-screen meter.
- Embedded QA target is now **140/140**.

### Session 30 — post-`v0.17.0` "Temporal Debt & Wraiths"
- Time Pendant menu now binds powers to RMB without immediate activation; Rewind/Forward are hold-duration powers, with Time Blink and Anchor/Return added as expert tools.
- Added named **temporal debt** tiers and a compact HUD meter while holding the pendant.
- Added **Time Wraiths** that can spawn from high debt and continue hunting during Time Stop.
- Added 5/30/60-second **timeline overlay ghosts** for active rewind/forward playback.
- Corrected bow controls to **LMB hold/release only**; RMB is ignored for bows, bow charging no longer triggers melee, and tap shots are weaker.
- Removed the Death Compass HUD meter/red line; the held compass model needle now carries the direction readout.
- Time Pendant is retained through death unless manually dropped, and active rewind holds can rewind through the death message.
- Embedded QA target is now **145/145**.

### Session 31 — post-`v0.17.0` "Golden Loop Polish"
- Mouse wheel direction now matches the requested hotbar feel: scroll up moves right, scroll down moves left.
- General toasts, pickup notifications, and Time Pendant messages now share one bottom-left stack so messages do not overlap.
- Time-effect VFX are throttled/capped: fewer portal/rift particles, lower-poly temporary rings, capped active ripples/portals, and throttled sky-tear overlays.
- Waystone quest guidance now points to the next unlit waystone by name, direction, progress, and distance/across-sea hint.
- Hotbar, inventory, crafting result, and recipe rows now expose readable item names through title/ARIA labels while preserving icon-first slots.
- Hold Forward now fast-forwards only while RMB is held and stops on release, matching the hold-based Rewind model.
- README now records the Godot strategy: keep Three.js for core-loop prototyping, but run a Godot 4 web-export spike before any engine migration.
- Local Godot check: no Godot binary is installed in this workspace yet, so the web-export smoke test remains a pending gate.
- Embedded QA is now **148/148**.

### Session 32 — post-`v0.17.0` "Boat Exit, Rewind World Edits & Golden-Loop Audio"
- Press **Space** to exit the boat immediately (previously required `E` or walking off).
- **Time Rewind now reverses world edits**: block breaks/places, placed foliage (torches, boats, bedrolls, grass, flowers, bugs), and the `blockEdits` save journal all roll back to the snapshot time. The world truly returns to its past state.
- Added `blockEditOriginals` map so the first value overwritten at each position is remembered, enabling clean revert without re-running terrain generation.
- **Night-fall banner**: When night approaches, a "Night Falls" banner appears so the player can prepare.
- **Time power audio cues**: Stop, Blink, Anchor, Rewind, and Wraith spawn each have distinct sounds using the existing SFX pipeline.
- **Anchor context prompt**: When an anchor is set, the Time Pendant prompt shows "RMB Return to Anchor" instead of the default action.
- **Time state persistence**: `lastAction`, `consequenceLevel`, and `temporalAnchor` are now saved/loaded with the game.
- Embedded QA is now **154/154**.

### Session 33 — post-`v0.17.0` "WebGPU Track Init"
- Engine strategy updated to dual-track: WebGPU (active) + Godot 4 (future fallback).
- WebGPU chosen for near-native GPU performance in browser with zero install friction.
- Prototype target: GPU chunk meshing compute shader to eliminate main-thread jitter.
- Godot port deferred until WebGPU track is evaluated.

### Session 16 — `v0.9.0` "Better Item Models"
- Replaced all remaining default-box item models with distinctive low-poly 3D shapes:
  - **Stone (2)** → rough octahedron lump
  - **Moss (1)** → block with green cap
  - **Bark (5)** → mini log segment (stacked cylinders)
  - **Planks (9)** → flat board with grain lines
  - **Cobble (10)** → irregular dodecahedron with chip detail
  - **Sand (11)** → small piled cylinder
  - **Iron ore (12)** → rocky chunk with metallic flecks
  - **Leaf (6)** → flat leaf with vein
  - **Bowl (51)** → shallow bowl (cylinder + torus rim)
  - **Flowers (14,15)** → bloom on thin stem
  - **Grass (13)** → dirt clod with green top
  - **Amber (3)** → faceted octahedron gem with warm glow halo
  - **Mirror (4)** → flat angular shard with teal glow halo
  - **Roasted root (53)** → tapered root shape
  - **Flatbread (54)** → flat disc with lighter center
  - **Glow apple (58)** → apple sphere with stem + glow aura
- New embedded QA test verifies all key item types produce non-trivial 3D bounding boxes.
- Embedded QA target is now **115/115**.

### Session 15 — `v0.8.1` "Death & Scroll"
- **Mouse scroll wheel** now cycles the hotbar selection (up/down).
- **Death drops fixed**: items dropped on death no longer auto-pickup while the death screen is showing — they wait at the death spot for the player to return.
- **Double-strike bug fixed**: holding LMB on a monster no longer calls `strikeMonster` twice per frame (both `updateMining` and the fallback attack loop were doing it).
- **More lag fixes**: `footprintColumns` replaced `Set<string>` with numeric key object to avoid per-frame string garbage (5-6 calls × 9 strings each per physics frame). Reused Vector3 pool (`_fwd`, `_rgt`, `_move`) in `updatePlayer` instead of creating 3 new Vector3s every frame.
- Embedded QA still **114/114**.

### Session 14 — `v0.8.0` "Performance Tuning"
- Fixed 5 sources of occasional lag spikes identified via automated profiling:
  - **String garbage**: Replaced `LIQUID_TYPES.has(String(b))` with a precomputed `IS_LIQUID[b]` boolean array (~10 hot paths, no per-frame string allocations).
  - **chunkKey string creation**: Changed `chunkKey` from string concatenation to numeric bit-packed key `(cx<<16)|(cz&0xffff)`. Updated all unpacking sites to use bit-shifts instead of `.split(',').map(Number)`.
  - **Particle allocation storm**: Added an object pool (`particlePool`) so `spawnParticle` reuses meshes instead of `new THREE.Mesh` + `new THREE.MeshBasicMaterial` per particle. Dead particles are returned to the pool instead of disposed.
  - **Full scene matrix update**: Replaced `scene.updateMatrixWorld(true)` in `raycast` with targeted `agent.updateWorldMatrix(true,false)` per agent — avoids traversing hundreds of chunk meshes per frame.
  - **Array.splice in hot paths**: Replaced `splice(i,1)` with swap-remove (`pop` + overwrite) in `updateDamageNumbers`, `updateBossTelegraphs`, `removeDropletItem`, `removeAgent`, and `updateParticles`.
  - **Chunk mesh rebuild spike**: Spread chunk `buildChunkMesh` across frames (8 per frame via `chunkBuildQueue`) instead of rebuilding all ~200 chunks at once when crossing a chunk boundary.
- LMB/RMB now strictly follows the crosshair: `updateMining` re-raycasts every frame so looking away cancels mining (or switches to whatever the crosshair hits — enemy, foliage, or new block).
- First-person rest pose: hands sit lower and farther apart when idle.
- Action poses for mining, sword, bow, torch, eating, boat, and default equipped states.
- Third-person player model mirrors first-person action poses (arm rotation matching each held-item type).
- Reduced RMB placement cooldown from 250ms → 120ms for snappier response.
- High-level chase animation: arm swing, head bob synced to gait.
- High-level flee animation: body faces away, head looks back, arms raised defensively.
- Boss charge telegraph: camera halo narrows, body leans forward, panels angle back, dust trail.
- Boss slam telegraph: arms lock upward, warning ring expands, shockwave on impact.
- Boss teleport animation: panels fold in, aura collapses, brief shrink, reappear with unfold particle burst.
- Embedded QA target is now **114/114**.

---

## Testing

### Manual QA
Open the game with `?test` URL parameter to run the embedded self-test suite (155 tests). Results appear in a green/red panel.

### Headless self-test runner
```bash
node /tmp/opencode/nix-test/test-qa-visual.js
```

### Profiling
Open the game with `?perf` URL parameter to auto-start a new game with dev stats (U/C/R timing breakdown) and load-time profiling logged to console.

### Writing Tests
Add tests to the `?test` block in the HTML file. Each test calls `check(label, condition)`.

---

## Project Structure

```
inner-wilds-game/
├── inner-wilds-game.html         # Main game (single file)
├── inner-wilds-game-backup.html  # Backup with original detailed models
├── README.md                     # This file
├── .gitignore
└── tests/
    ├── README.md
    ├── run-selftest.js           # Headless ?test runner (puppeteer-core)
    ├── test-qa-visual.js         # QA visual test runner
    ├── test-auto-play.js         # HTTP playthrough script
    ├── test-auto.js              # Utility for auto tests
    └── run-test.sh               # Test runner script
```
