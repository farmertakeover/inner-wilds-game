# Inner Wilds — 3D Voxel Survival/Adventure Game

**Current version: `v0.7.6` — "Performance HUD Polish"** (shown in main menu and top-right HUD badge).

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
| Space | Jump (hold while moving = auto-jump) |
| Left-click | Mine block / Attack creature |
| Right-click | Place selected item / Eat food / Drink potion |
| E | Interact (talk to NPCs, activate) |
| F | Center breath (restore resolve) |
| Tab | Toggle inventory + Journal/Quests |
| C | Toggle crafting |
| 1-9 | Select hotbar slot |
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

`inner-wilds-game.html` is ~4600 lines, all in one file. No build step. Three.js loaded from CDN (`<script type="module">`).

### Key Module-Scoped Variables
- `camera` / `scene` / `renderer` — standard Three.js, camera is added to scene
- `player` — `{ pos, velY, inventory, hotbar, hp, hunger, temperature, resolve, noise, monstersRepelled, trusted, waystones, discovered, boating, grounded }`
- `dayTime` — 0..1 float, drives sun position
- `weather` — `{ type, intensity }` — one of: clear, softFog, mirrorRain, emberAsh
- `agents` — array of NPC/monster/boss/animal groups
- `chunks` — Map of chunk key → Uint8Array voxel data
- `chunkMeshes` — Map of chunk key → Three.js Mesh (greedy-meshed)
- `placedFoliage` — array of sprite meshes (grass, flowers, bugs, torches)
- `droppedItems` — array of dropped item entities

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
- **Boat**: Craftable floating platform entity with WASD steering and water physics
- **Sleep**: Bedroll item skips to dawn
- **Crafting**: 27+ recipes, recipe discovery toasts
- **AI**: Hollowling state machine (IDLE → CHASING → ATTACKING → FLEEING), Surveyor Echo minion AI, animal idle wander

---

## Exhaustive Development Roadmap

> A complete vision for the game as if a professional team of artists, engineers, designers, and writers worked on it for years. Each section is ordered by priority.

---

## Current Production Slice — `v0.7.6` "Performance HUD Polish"

This slice continues the post-v0.6.0 art pass. The goal is to make the cel-shaded art direction feel complete, not like terrain, characters, items, pickups, sound effects, and music belong to different games.

### Sprint Goal
Make the entire game read as one cohesive cel-shaded adventure: terrain, characters, enemies, boss, animals, items, UI, animations, drops, crafting previews, combat feedback, sound effects, and music should share the same production language.

### Must Ship First
- [ ] **Cel-shade every remaining character model**: Player avatar, Cartographer, Hollowlings, Surveyor Echoes, Glass Elk, Lantern Hare, boss panels, boss body parts, waystones, boat, dropped items, and held items must use `modelMat()` / `MeshToonMaterial` with `getToonGradient()`.
- [ ] **Unify outline language**: Add a controlled black/dark-blue outline pass or backface shell only for characters, enemies, boss, items, and interactables. Keep terrain outline-free or very subtle so the world does not become noisy.
- [ ] **Enemy attack animations**: Add wind-up, active-hit, and recovery animation states for Hollowlings, Surveyor Echoes, and the Hollow Surveyor. Attacks must telegraph before damage happens.
- [ ] **Better item models**: Replace plain cubes/boxes with readable low-poly models for sword, bow, pickaxe, axe, torch, bedroll, boat item, food, potions, ore, amber, mirror shards, and waystone fragments.
- [ ] **Held-item consistency**: First-person held item, third-person held item, dropped item, inventory preview, and crafting result should use the same model factory per item type.
- [ ] **Combat readability**: Add enemy wind-up glow, slash arcs, impact freeze for 80-120ms on heavy hits, hit spark particles, and boss attack warning rings.
- [ ] **Performance guardrail**: All new models must be low-poly, material-shared, geometry-pooled, and capped to preserve 60 FPS on mid-range hardware.

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

### Acceptance Criteria
- [ ] QA suite passes with no JS errors.
- [ ] A fresh New Game shows no duplicate/ghost limbs in first person.
- [ ] Continue from a saved file loads into terrain, not a blue/empty view.
- [ ] All model-like objects use toon materials or intentionally documented exceptions.
- [ ] Enemy attacks have a visible pre-hit telegraph of at least 350ms.
- [ ] Boss attacks have distinct silhouettes: charge, slam, shockwave, summon, teleport.
- [ ] Hotbar, dropped item, held item, and crafting preview all match for at least 15 core items.
- [ ] SFX and music reinforce the pastel cel-shaded adventure tone without becoming harsh, muddy, or horror-like.
- [ ] Frame time stays below 16.7ms average at render distance 3 on the target browser.

### Expert Recommendation
Do not add more systems before this sprint lands. The game already has enough systems to feel rich; the next jump in perceived quality comes from art consistency, animation readability, and interaction polish. A player will forgive simple mechanics if every action looks intentional. They will not forgive beautiful terrain paired with placeholder character/item models.

---

## Answered TODO List — What To Do Next

### 1. Cel-shade the rest of the game
- [ ] Convert all `MeshStandardMaterial` character/item materials to `modelMat()` unless the material needs special transparency, emissive glow, or water-like behavior.
- [ ] Add a `toonMat(color, opts={})` helper that wraps `MeshToonMaterial`, `gradientMap:getToonGradient()`, texture generation, emissive handling, and optional outline metadata.
- [ ] Audit every model factory: `humanoid()`, `makeMonster()`, `makeBoss()`, `makeAnimal()`, `makeWaystone()`, `buildBoatModel()`, `buildFirstPersonHands()`, `updateHandItem()`, `spawnDroppedItem()`.
- [ ] Add a self-test that traverses `agents`, `playerModel`, `boatModel`, and dropped item meshes to ensure model materials are toon materials.
- [ ] Keep block terrain cel-shading flat and readable; do not over-outline every voxel face.

### 2. Fix and improve first-person/third-person limbs
- [ ] Keep the v0.6.0 single-pass viewmodel approach unless a GPU-specific bug resurfaces.
- [ ] Reduce first-person arm count visually: forearm + hand + thumb is enough; upper sleeve can be shortened or hidden below screen edge.
- [ ] Add a first-person "rest pose" where hands sit lower and farther apart when idle.
- [ ] Add distinct poses for mining, sword swing, bow draw, eating, placing blocks, rowing boat, holding torch, and interacting.
- [ ] Mirror first-person actions in the third-person player model so another camera angle reads the same action.

### 3. Enemy attack animations
- [ ] Hollowling bite/claw: crouch wind-up, shoulders pull back, arms snap forward, head lunges, 500ms recovery.
- [ ] Hollowling chase: forward lean, uneven arm swing, head bob synced to step rhythm.
- [ ] Hollowling flee: turn torso away but head glances back, arms raised defensively.
- [ ] Surveyor Echo swipe: map-panel flicker, arm blade extension, side slash arc.
- [ ] Hollow Surveyor charge: compass halo narrows, body leans forward, panels trail behind, dust/energy trail follows.
- [ ] Hollow Surveyor slam: hover upward, arms lock, warning ring expands on ground, slam impact creates shockwave ring.
- [ ] Hollow Surveyor teleport: panels fold inward, silhouette collapses to a point, reappears with reversed panel unfold.
- [ ] Add animation state fields to agent data: `animState`, `animT`, `attackWindup`, `attackActive`, `attackRecovery`, `lastAttackType`.
- [ ] Damage should only happen during the active-hit window, never at the start of wind-up.

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
- [ ] Pool geometries/materials for items, drops, particles, and agent body parts.
- [ ] Keep all new models under strict primitive budgets: normal item under 12 meshes, enemy under 30 meshes, boss under 80 meshes.
- [ ] Convert repeated model details to `InstancedMesh` where possible: grass, flowers, fireflies, dropped shards, boss particles.
- [ ] Add dynamic render scale if average frame time exceeds target for 3 seconds.
- [ ] Add a chunk rebuild queue that processes one dirty chunk per frame during gameplay.

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
- [ ] **Hollowling redesign**: Glowing eye slits, crystalline growths, translucent body showing internal lights
- [ ] **Surveyor redesign**: Floating brass-and-stone frame, articulated compass arms, orbiting map panels with glowing arcana
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
- [ ] **Toast system**: Stacking toasts with slide-in animation, category icons
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
- [ ] **Dynamic resolution**: Scale render resolution down when framerate drops below target
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

---

## Testing

### Manual QA
Open the game with `?test` URL parameter to run the embedded self-test suite (113 tests). Results appear in a green/red panel.

### Headless self-test runner
```bash
# Requires puppeteer-core
node tests/run-selftest.js
CHROME_PATH=/path/to/chrome node tests/run-selftest.js
```

### Automated Playthrough
```bash
GAME_URL="http://127.0.0.1:8080/inner-wilds-game.html" node tests/test-auto-play.js
```

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
