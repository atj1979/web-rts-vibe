import * as THREE from "three";
import { createNameSprite } from "../../core/nameSprite";

/**
 * Designer_3d style: procedural circular keep (instanced bricks) with triplanar shader.
 * Creates a THREE.Group containing an InstancedMesh of bricks, a portcullis, and exposes
 * per-brick HP/defect metadata and a small API.
 *
 * Usage:
 *   const keep = createKeep({ radius: 15 })
 *   scene.add(keep.group)
 *   keep.damageBrick({layer:0,slot:2}, 25)
 *
 */
export function createKeep(params = {}) {
  const opts = Object.assign(
    {
      bricksPerLayer: 16,
      layers: 20,
      brickWidth: 1.75,
      brickHeight: 1.0,
      brickDepth: 0.33,
      gap: 0.05,
      radius: 15,
      portcullisWidth: 4,
      portcullisHeight: 7,
      defaultHP: 100,
      fast: true,
      triplanar: true,
      stagger: false,
      mobileMode: false,
    },
    params,
  );

  const group = new THREE.Group();
  group.name = "keep";

  // Attach a reusable name sprite so keep is always identifiable
  const keepSprite = createNameSprite(
    "Keep",
    Math.floor(Math.random() * 10000),
  );
  keepSprite.position.set(0, opts.layers * opts.brickHeight + 1.0, 0);
  group.add(keepSprite);

  const totalSlots = opts.bricksPerLayer * opts.layers;

  // Box geometry for a single brick
  const geo = new THREE.BoxGeometry(
    opts.brickWidth - opts.gap,
    opts.brickHeight,
    opts.brickDepth,
  );

  // Simple triplanar-ish shader material (fast approximation)
  const material = createTriplanarMaterial({
    baseColor: new THREE.Color(0x8b7d6b),
  });

  // Create instanced mesh with fixed maximum count
  const inst = new THREE.InstancedMesh(geo, material, totalSlots);
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Per-instance metadata stored in JS arrays
  const instanceMeta: Array<{
    hp: number;
    maxHp: number;
    defect: number;
    alive: boolean;
  }> = [];

  // Instanced attributes for defect and hp (so shader can read defect if needed)
  const defectArray = new Float32Array(totalSlots);
  const hpArray = new Float32Array(totalSlots);
  const instanceDefectAttr = new THREE.InstancedBufferAttribute(defectArray, 1);
  const instanceHpAttr = new THREE.InstancedBufferAttribute(hpArray, 1);
  geo.setAttribute("instanceDefect", instanceDefectAttr);
  geo.setAttribute("instanceHp", instanceHpAttr);

  // Helper: convert layer,slot -> index
  function slotIndex(layer: number, slot: number) {
    return layer * opts.bricksPerLayer + (slot % opts.bricksPerLayer);
  }

  // Build placement: circular arrangement around opts.radius, angle 0 is front (+X)
  for (let layer = 0; layer < opts.layers; layer++) {
    const y = opts.brickHeight * 0.5 + layer * opts.brickHeight;
    const staggerOffset =
      opts.stagger && layer % 2 === 1 ? opts.brickWidth / 2 : 0;

    for (let slot = 0; slot < opts.bricksPerLayer; slot++) {
      const idx = slotIndex(layer, slot);

      // default metadata
      instanceMeta[idx] = {
        hp: opts.defaultHP,
        maxHp: opts.defaultHP,
        defect: 0,
        alive: true,
      };
      defectArray[idx] = 0;
      hpArray[idx] = opts.defaultHP;

      // compute angle and position
      const angle = (slot / opts.bricksPerLayer) * Math.PI * 2;
      const x = Math.cos(angle) * opts.radius;
      const z = Math.sin(angle) * opts.radius;

      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle + Math.PI / 2);
      m.compose(
        new THREE.Vector3(x + staggerOffset, y, z),
        q,
        new THREE.Vector3(1, 1, 1),
      );
      inst.setMatrixAt(idx, m);
    }
  }

  // Apply portcullis: remove bricks at front centered on angle 0
  const frontSlotCenter = 0; // slot at angle 0
  const half = Math.floor(opts.portcullisWidth / 2);
  const removed = new Set<number>();
  for (let layer = 0; layer < opts.portcullisHeight; layer++) {
    const targetLayer = layer; // from ground up
    for (let s = -half; s <= half; s++) {
      const slot =
        (frontSlotCenter + s + opts.bricksPerLayer) % opts.bricksPerLayer;
      const idx = slotIndex(targetLayer, slot);
      // hide by scaling to zero
      const m = new THREE.Matrix4();
      m.makeScale(0.0001, 0.0001, 0.0001);
      inst.setMatrixAt(idx, m);
      instanceMeta[idx].alive = false;
      removed.add(idx);
      defectArray[idx] = 1;
      hpArray[idx] = 0;
    }
  }

  // Battlements: top layer crenellations - remove alternating bricks on topmost layer
  const topLayer = opts.layers - 1;
  for (let slot = 0; slot < opts.bricksPerLayer; slot++) {
    if (slot % 2 === 0) continue; // keep even slots
    const idx = slotIndex(topLayer, slot);
    if (removed.has(idx)) continue;
    const m = new THREE.Matrix4();
    m.makeScale(0.0001, 0.0001, 0.0001);
    inst.setMatrixAt(idx, m);
    instanceMeta[idx].alive = false;
    defectArray[idx] = 1;
    hpArray[idx] = 0;
  }

  // finalize attributes
  instanceDefectAttr.needsUpdate = true;
  instanceHpAttr.needsUpdate = true;
  inst.count = totalSlots;

  group.add(inst);

  // add a simple portcullis mesh (thin box) at front that can be raised/lowered
  const portWidth =
    ((opts.portcullisWidth / opts.bricksPerLayer) *
      (Math.PI * 2 * opts.radius)) /
    (2 * Math.PI); // approx arc length -> linear
  const portGeo = new THREE.BoxGeometry(
    portWidth,
    opts.portcullisHeight * opts.brickHeight,
    0.1,
  );
  const portMat = material.clone();
  const portcullis = new THREE.Mesh(portGeo, portMat);
  portcullis.name = "portcullis";
  portcullis.position.set(
    opts.radius + opts.brickDepth * 0.5 + 0.1,
    (opts.portcullisHeight * opts.brickHeight) / 2,
    0,
  );
  group.add(portcullis);

  // Event listeners for destroyed
  const destroyedListeners: Array<(info: any) => void> = [];

  function damageBrick(
    id: number | { layer: number; slot: number },
    amount: number,
  ) {
    let idx = -1;
    if (typeof id === "number") idx = id;
    else idx = slotIndex(id.layer, id.slot);
    if (idx < 0 || idx >= instanceMeta.length) return null;
    const meta = instanceMeta[idx];
    if (!meta.alive) return { destroyed: true };
    meta.hp -= amount;
    if (meta.hp <= 0) {
      meta.hp = 0;
      meta.alive = false;
      // hide instance
      const m = new THREE.Matrix4();
      m.makeScale(0.0001, 0.0001, 0.0001);
      inst.setMatrixAt(idx, m);
      inst.instanceMatrix.needsUpdate = true;
      hpArray[idx] = 0;
      defectArray[idx] = 1;
      instanceHpAttr.needsUpdate = true;
      instanceDefectAttr.needsUpdate = true;
      const info = { index: idx };
      destroyedListeners.forEach((cb) => cb(info));
      return { destroyed: true };
    }
    hpArray[idx] = meta.hp;
    instanceHpAttr.needsUpdate = true;
    return { destroyed: false, hp: meta.hp };
  }

  function getBrickData(id: number | { layer: number; slot: number }) {
    let idx = -1;
    if (typeof id === "number") idx = id;
    else idx = slotIndex(id.layer, id.slot);
    if (idx < 0 || idx >= instanceMeta.length) return null;
    const m = instanceMeta[idx];
    return {
      index: idx,
      hp: m.hp,
      maxHp: m.maxHp,
      defect: m.defect,
      alive: m.alive,
    };
  }

  function onBrickDestroyed(cb: (info: any) => void) {
    destroyedListeners.push(cb);
    return () => {
      const i = destroyedListeners.indexOf(cb);
      if (i >= 0) destroyedListeners.splice(i, 1);
    };
  }

  // Public API
  return {
    group,
    instancedMesh: inst,
    params: opts,
    damageBrick,
    getBrickData,
    onBrickDestroyed,
    // convenience: convert coords
    slotIndex,
  };
}

// Minimal triplanar-like ShaderMaterial factory. Fast, approximate, and self-contained.
function createTriplanarMaterial({
  baseColor = new THREE.Color(0x8b7d6b),
} = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: baseColor },
      lightDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
      ambient: { value: 0.25 },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vec4 wpos = modelMatrix * vec4(position, 1.0);
        vWorldPos = wpos.xyz;
        gl_Position = projectionMatrix * viewMatrix * wpos;
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 lightDir;
      uniform float ambient;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      // simple pseudo-random
      float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

      // triplanar blend
      vec3 triplanarColor(vec3 p, vec3 n){
        vec3 a = abs(n);
        vec3 w = a / (a.x + a.y + a.z + 1e-5);
        // sample three planes with simple noise-based tint
        float sX = hash(p.yzx * 0.5);
        float sY = hash(p.zxy * 0.5);
        float sZ = hash(p.xyz * 0.5);
        vec3 cX = baseColor * (0.8 + 0.4 * sX);
        vec3 cY = baseColor * (0.85 + 0.3 * sY);
        vec3 cZ = baseColor * (0.7 + 0.5 * sZ);
        return cX * w.x + cY * w.y + cZ * w.z;
      }

      void main(){
        vec3 n = normalize(vNormal);
        vec3 color = triplanarColor(vWorldPos, n);
        // simple lambert + ambient
        float L = max(dot(n, normalize(lightDir)), 0.0);
        vec3 col = color * (ambient + 0.9 * L);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return mat;
}
