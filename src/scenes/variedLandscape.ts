import * as THREE from "three";
import { createTreeOak } from "../objects/tree/tree_oak";
import { createTreePine } from "../objects/tree/tree_pine";
import { createTreeBlossom } from "../objects/tree/tree_blossom";
import { createTestSphere } from "../objects/testSphere";
import { createGrass } from "../objects/grass";
import { createFlower } from "../objects/flower";
import { getGlobalGroundPlacer } from "../core/groundPlacement";
// Note: auto-culling is enabled globally; manual registerForCulling isn't required here.

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

  // --- Dense Vegetation: Trees, Grass, and Flowers ---
  const groundPlacer = getGlobalGroundPlacer(scene);

  // Trees (increased from 30 to 120 for denser forest)
  const treeTypes = [createTreeOak, createTreePine, createTreeBlossom];
  const numTrees = 120;
  const minTreeRadius = 8;
  const maxTreeRadius = 95;

  for (let i = 0; i < numTrees; i++) {
    const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    const tree = type();
    tree.scale.setScalar(3); // Make trees 3x bigger
    const angle = Math.random() * Math.PI * 2;
    const radius =
      minTreeRadius + Math.random() * (maxTreeRadius - minTreeRadius);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    groundPlacer.placeObject(tree, x, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
    objects.push(tree);
  }

  // Grass patches (scattered throughout the landscape)
  const numGrassPatches = 200;
  const grassColors = [0x228b22, 0x32cd32, 0x006400, 0x9acd32]; // various greens

  for (let i = 0; i < numGrassPatches; i++) {
    const grass = createGrass({
      color: grassColors[Math.floor(Math.random() * grassColors.length)],
      size: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
      fill: 8 + Math.floor(Math.random() * 12), // 8 to 20 blades
      windStrength: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
    });

    // Place grass randomly across the terrain
    const x = (Math.random() - 0.5) * 180; // -90 to 90
    const z = (Math.random() - 0.5) * 180; // -90 to 90
    groundPlacer.placeObject(grass, x, z);
    grass.rotation.y = Math.random() * Math.PI * 2;
    scene.add(grass);
    objects.push(grass);
  }

  // Flowers (scattered throughout, avoiding dense clusters)
  const numFlowers = 150;
  const flowerColors = ["yellow", "blue", "pink", "purple", "white"];

  for (let i = 0; i < numFlowers; i++) {
    const flower = createFlower({
      color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
      petalSize: 0.08 + Math.random() * 0.08, // 0.08 to 0.16
      petalCount: 4 + Math.floor(Math.random() * 5), // 4 to 9
      stemHeight: 0.6 + Math.random() * 0.4, // 0.6 to 1.0
      windStrength: 0.4 + Math.random() * 0.3, // 0.4 to 0.7
    });

    // Place flowers randomly, but avoid very center and edges
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 70; // 15 to 85 (avoid center and edges)
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    groundPlacer.placeObject(flower, x, z);
    flower.rotation.y = Math.random() * Math.PI * 2;
    scene.add(flower);
    objects.push(flower);
  }

  // --- Test Sphere for terrain ground placement ---
  const testSphere = createTestSphere({ color: 0xff0000 }); // red sphere for terrain
  groundPlacer.placeObject(testSphere, 10, 10); // Place at (10, 10) on terrain
  scene.add(testSphere);
  objects.push(testSphere);

  // Scene switcher contract:
  return {
    dispose() {
      for (const obj of objects) {
        // Remove from scene
        scene.remove(obj);
        // If an object registered its own culler before global auto-culling was enabled,
        // call its unregister helper if present.
        try {
          const u = (obj as any).__unregisterCuller;
          if (typeof u === "function") u();
        } catch (_) {}
        // Dispose geometry/material if present
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
      return new THREE.Vector3(0, z + 8, 0); // Increased from 1.1 to 8 to account for 3x bigger trees
    },
  };
}
