import * as THREE from "three";
import { createTreeOak } from "../objects/tree_oak";
import { createTreePine } from "../objects/tree_pine";
import { createTreeBlossom } from "../objects/tree_blossom";

/**
 * Adds a skybox and a floor to the given scene.
 * - Skybox: simple color gradient using a large sphere with inverted faces.
 * - Floor: large plane with a grid texture.
 */
export function addBasicWorld(scene: THREE.Scene) {
  // Track objects for disposal
  const objects: THREE.Object3D[] = [];

  // --- Skybox (gradient sphere) ---
  const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: true,
    fog: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  const colorTop = new THREE.Color(0x87ceeb); // sky blue
  const colorHorizon = new THREE.Color(0xffffff); // white
  const pos = skyGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 1000; // normalized height
    const c = colorTop.clone().lerp(colorHorizon, (y + 1) / 2);
    colors.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  scene.add(skyMesh);
  objects.push(skyMesh);

  // --- Floor (large grid) ---
  const floorSize = 200;
  const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize, 40, 40);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide,
    wireframe: false,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);
  objects.push(floor);

  // Add a grid helper for visual interest
  const grid = new THREE.GridHelper(floorSize, 40, 0x888888, 0xcccccc);
  grid.position.y = 0.01;
  scene.add(grid);
  objects.push(grid);

  // --- Random Trees ---
  const treeTypes = [createTreeOak, createTreePine, createTreeBlossom];
  const numTrees = 20;
  const minRadius = 8; // avoid center
  const maxRadius = 80;
  for (let i = 0; i < numTrees; i++) {
    const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    const tree = type();
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
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
      // Center, just above floor
      return new THREE.Vector3(0, 1.1, 0);
    },
  };
}
