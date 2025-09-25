## ✅ AI Prompt Checklist for Building a Tank Asset (Procedural, No Textures)

### Step 1 – Base Structure

- [ ] Create a 3D model of a military tank (Three.js).
- [ ] Do **not** use external textures or image files — use only procedural materials/colors.
- [ ] Break into distinct parts:
  - Body
  - Turret
  - Barrel
  - Tracks
  - Wheels
- [ ] Ensure turret rotates independently, and barrel elevates/depresses.
- [ ] Keep polygon count reasonable for VR performance.

### Step 2 – Refinement & Proportions

- [ ] Add bevels/rounded edges to reduce blockiness.
- [ ] Use different colors/materials to distinguish metal, tracks, and details.
- [ ] Match proportions to a real-world tank (M1 Abrams / T-90 as reference).
- [ ] Keep code self-contained (no assets downloaded).
- [ ] Make model reusable (so multiple tanks can be spawned).

### Step 3 – Functionality

- [ ] Add methods to rotate turret programmatically.
- [ ] Add methods to raise/lower barrel.
- [ ] Add movement logic: tank can move forward/backward.
- [ ] Animate tracks when tank moves.
- [ ] Allow scaling to adjust tank size.
- [ ] Optimize for multiple tanks in the same scene.

### Step 4 – Visual Quality

- [ ] Add lighting/shading so metal looks metallic.
- [ ] Use procedural variations (color gradients/noise) to avoid flat look.
- [ ] Add small geometry details:
  - Hatches
  - Periscopes
  - Antenna
  - Exhaust vents
  - Headlights
- [ ] Keep everything procedural and efficient.

### Step 5 – Polishing

- [ ] Organize code into reusable components or functions.
- [ ] Group parts logically (body, turret, barrel) for easy game logic control.
- [ ] Ensure consistent scale and units across model.
- [ ] Test performance with multiple instances in-scene.
