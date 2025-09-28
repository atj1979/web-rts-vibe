````markdown
# Advanced Tank Development Plan — Checklist

Purpose

- Combine `development_plan.md` with a concrete, ordered implementation plan that is directly actionable and checkable.

Quick status

- [x] Plan reviewed
- [x] Defaults chosen (style/quality)

Core requirements

- [x] Body, turret, barrel, tracks, wheels
- [x] Turret rotation (independent)
- [x] Barrel elevation
- [x] Procedural PBR materials (no external textures)
- [x] Animated tracks & wheel-sync
- [x] Programmatic API (rotateTurret, setBarrelElevation, move, scale)
- [ ] VR-friendly performance targets and `mobileMode`

Ordered implementation checklist

Phase A — Foundation

- [x] 1. Define public API and module skeleton
  - [x] Export: `createTank(params)` -> THREE.Group
  - [x] Define `TankParams` shape and defaults
- [x] 2. Create repository-friendly file layout
  - [x] `src/objects/tank/createTank.ts` (module skeleton)
  - [ ] `src/objects/tank/demo.ts` (demo harness)

Phase B — Geometry & Hierarchy

- [x] 3. Implement geometry builders (shared, re-used)
  - [x] `buildBody()`
  - [x] `buildTurret()`
  - [x] `buildBarrel()`
  - [x] `buildWheel()` (single geometry reused)
  - [x] `buildTrackStrip()` (default, procedural UV-scroll)
- [x] 4. Compose hierarchy
  - [x] root -> body -> turret -> barrel
  - [x] attach wheels and tracks to body
  - [x] expose `.parts` refs

Phase C — Material & Shader

- [x] 5. Create shared material factory `createTankMaterial(params)`
  - [x] ShaderMaterial skeleton with uniforms (albedo, roughness, metalness, seed, wearIntensity, dirtAmount, detailScale)
  - [x] Triplanar-style FBM blending in shader
  - [x] FBM noise (3–5 octaves desktop, 1–2 mobile)
  - [ ] Normal-from-height option
  - [ ] Fallback: MeshStandardMaterial on compile failure

Phase D — Animation & Controls

- [x] 6. Implement turret rotation and barrel elevation methods
  - [x] `rotateTurret(angleRad)`
  - [x] `setBarrelElevation(angleRad)` (with clamp)
- [x] 7. Implement movement and wheel-sync
  - [x] `move(distance, deltaTime)` updates position and wheel rotation
  - [x] Track shader offset uniform updated from traveled distance

Phase E — Tracks (options)

- [x] 8. Implement default tracks = Option B (procedural UV-scroll strip)
  - [ ] Shader generates tread pattern and scrolls by offset
  - [ ] Ensure visual depth with normal-from-height
- [ ] 9. Optional later: Option A (instanced track links) for high fidelity

Phase F — Polishing & Performance

- [ ] 10. Add LOD switch and `mobileMode` optimization
  - [ ] Reduce geometry, FBM octaves, and shader cost for low quality
- [ ] 11. Share geometries/materials between instances by default
- [x] 12. Add `dispose()` for unique resources

Phase G — Demo, GUI, Tests

- [x] 13. Add demo spawn & Leva/dat.GUI controls wired to uniforms
- [ ] 14. Unit tests for API surface (createTank, rotateTurret, setBarrelElevation)
- [ ] 15. Smoke/perf tests: spawn 1/10/50 tanks and check Stats.js

Debugging & quality gates (check when ready)

- [ ] Shader debug modes (toggle display of albedo/wear/metal/roughness/normal/AO)
- [ ] Fallback to MeshStandardMaterial on shader compile failure

Tracks approach decision (mark chosen)

- [x] Option B — Procedural UV-scroll strip (DEFAULT)
- [ ] Option A — Instanced links (high fidelity)
- [ ] Option C — Mixed geometry + shader displacement

Notes / Implementation hints

- Keep one shared material per visual style to reduce cost.
- Use triplanar mapping when UVs are poor.
- For edge wear, approximate curvature via normal/view-based masks if precomputed curvature not available.

Small usage example

```js
import { createTank } from "./objects/tank/createTank";
const tank = createTank({ seed: 42, color: 0x2b6b9b, wearIntensity: 0.5 });
scene.add(tank);
tank.rotateTurret(Math.PI / 4);
tank.setBarrelElevation(-0.15);
tank.move(1.0, deltaTime);
```
````

Next actions for me (mark when started/done)

- [x] Implement steps A–D: skeleton, geometry, material factory, basic controls (turret/barrel/move)
- [x] Implement default tracks (Option B) and demo harness

Completion criteria

- [x] `createTank(params)` exports a THREE.Group with working turret/barrel controls, moving wheels, and a procedural PBR material with `mobileMode`.

Resources

- three.js examples (instancing, custom shaders, node materials)
- IQ / Stefan Gustavson FBM & triplanar snippets
- Stats.js

```

```
