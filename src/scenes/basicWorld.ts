import * as THREE from "three";
import { createTestSphere } from "../objects/testSphere";
import { getGlobalGroundPlacer } from "../core/groundPlacement";

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
  const skyColors = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 1000; // normalized height
    const c = colorTop.clone().lerp(colorHorizon, (y + 1) / 2);
    skyColors.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(skyColors, 3));
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

  // --- Many Test Spheres for ground placement testing ---
  const numSpheres = 100;
  const minRadius = 5; // avoid center
  const maxRadius = 90;
  const sphereColors = [
    0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff,
  ]; // red, green, blue, yellow, magenta, cyan
  const groundPlacer = getGlobalGroundPlacer(scene);
  for (let i = 0; i < numSpheres; i++) {
    const color = sphereColors[Math.floor(Math.random() * sphereColors.length)];
    const sphere = createTestSphere({
      color: color,
      radius: 0.3 + Math.random() * 0.4, // 0.3 to 0.7 radius
    });
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    groundPlacer.placeObject(sphere, x, z);
    sphere.rotation.y = Math.random() * Math.PI * 2;
    scene.add(sphere);
    objects.push(sphere);
  }

  // --- Single Test Sphere for reference ---
  const testSphere = createTestSphere({ color: 0xffffff }); // white sphere for reference
  groundPlacer.placeObject(testSphere, 0, 0); // Place at origin
  scene.add(testSphere);
  objects.push(testSphere);

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
