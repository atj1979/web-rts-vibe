import * as THREE from "three";
import { createGrass } from "../objects/grass";

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

  // --- Random Grass Patches ---
  const numGrass = 50;
  const minRadius = 8; // avoid center
  const maxRadius = 80;
  for (let i = 0; i < numGrass; i++) {
    const grass = createGrass({
      color: new THREE.Color(0x228B22).offsetHSL(Math.random() * 0.1 - 0.05, Math.random() * 0.2 - 0.1, Math.random() * 0.1 - 0.05), // vary green shades
      size: 0.8 + Math.random() * 0.7, // 0.8 to 1.5
      fill: 10 + Math.floor(Math.random() * 10), // 10 to 20 blades
      windStrength: 0.3 + Math.random() * 0.4, // 0.3 to 0.7
      bladeWidth: 0.003 + Math.random() * 0.007, // 0.003 to 0.01
    });
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    grass.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    grass.rotation.y = Math.random() * Math.PI * 2;
    scene.add(grass);
    objects.push(grass);
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
