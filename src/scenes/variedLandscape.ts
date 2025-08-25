import * as THREE from "three";
import { createTreeOak } from "../objects/tree_oak";
import { createTreePine } from "../objects/tree_pine";
import { createTreeBlossom } from "../objects/tree_blossom";

// Simple 2D noise function (not true Perlin, but enough for demo)
function pseudoNoise(x: number, y: number) {
  return (
    Math.sin(x * 0.15 + Math.cos(y * 0.07)) * 0.5 +
    Math.cos(y * 0.18 + Math.sin(x * 0.11)) * 0.5
  );
}

export function addVariedLandscape(scene: THREE.Scene) {
  // Track objects for disposal
  const objects: THREE.Object3D[] = [];

  // --- Skybox (gradient sphere, as before) ---
  const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: true,
    fog: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  const colorTop = new THREE.Color(0x87ceeb);
  const colorHorizon = new THREE.Color(0xffffff);
  const pos = skyGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 1000;
    const c = colorTop.clone().lerp(colorHorizon, (y + 1) / 2);
    colors.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  scene.add(skyMesh);
  objects.push(skyMesh);

  // --- Terrain (hills/valleys) ---
  const size = 200;
  const segments = 100;
  const terrainGeo = new THREE.PlaneGeometry(size, size, segments, segments);
  // Displace vertices for hills/valleys
  const verts = terrainGeo.attributes.position;
  for (let i = 0; i < verts.count; i++) {
    const x = verts.getX(i);
    const y = verts.getY(i);
    const z = pseudoNoise(x, y) * 6 + pseudoNoise(x * 0.5, y * 0.5) * 2;
    verts.setZ(i, z);
  }
  verts.needsUpdate = true;
  terrainGeo.computeVertexNormals();
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x99cc88,
    roughness: 0.85,
    metalness: 0.15,
    side: THREE.DoubleSide,
    wireframe: false,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  scene.add(terrain);
  objects.push(terrain);

  // Grid helper
  const grid = new THREE.GridHelper(size, 40, 0x888888, 0xcccccc);
  grid.position.y = 0.01;
  scene.add(grid);
  objects.push(grid);

  // --- Random Trees on terrain ---
  const treeTypes = [createTreeOak, createTreePine, createTreeBlossom];
  const numTrees = 30;
  const minRadius = 10;
  const maxRadius = 90;
  for (let i = 0; i < numTrees; i++) {
    const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    const tree = type();
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    // Find terrain height at (x, y)
    const u = ((x + size / 2) / size) * segments;
    const v = ((y + size / 2) / size) * segments;
    const ix = Math.floor(u);
    const iy = Math.floor(v);
    let z = 0;
    if (ix >= 0 && ix < segments && iy >= 0 && iy < segments) {
      const idx = iy * (segments + 1) + ix;
      z = verts.getZ(idx);
    }
    tree.position.set(x, z, y);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
    objects.push(tree);
  }

  // Scene switcher contract:
  return {
    dispose() {
      for (const obj of objects) {
        scene.remove(obj);
        if ((obj as any).geometry) (obj as any).geometry.dispose?.();
        if ((obj as any).material) (obj as any).material.dispose?.();
      }
    },
    getSpawnPosition() {
      // Center, get terrain height at (0,0)
      const u = 0.5 * segments;
      const v = 0.5 * segments;
      const ix = Math.floor(u);
      const iy = Math.floor(v);
      let z = 0;
      if (ix >= 0 && ix < segments && iy >= 0 && iy < segments) {
        const idx = iy * (segments + 1) + ix;
        z = verts.getZ(idx);
      }
      return new THREE.Vector3(0, z + 1.1, 0);
    },
  };
}
