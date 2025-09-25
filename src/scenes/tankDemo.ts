import * as THREE from "three";
import { createTank } from "../objects/tank/createTank";
import { createKeep } from "../objects/keep/createKeep";
import { createTestSphere } from "../objects/testSphere";
import { getGlobalGroundPlacer } from "../core/groundPlacement";

export function addTankDemo(scene: THREE.Scene) {
  const objects: THREE.Object3D[] = [];

  // Simple sky and floor reuse pattern
  const floorGeo = new THREE.PlaneGeometry(200, 200);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x999977,
    roughness: 0.9,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);
  objects.push(floor);

  // Add the procedural tank created by createTank
  const tank = createTank({
    seed: 42,
    color: 0x3b6b8a,
    wearIntensity: 0.45,
    scale: 1,
  });
  tank.position.set(0, 0, 0);
  tank.rotation.y = Math.PI; // face forward
  scene.add(tank);
  objects.push(tank as any);

  // Add the circular keep (instanced bricks) — placed to the left of the tank
  const keep = createKeep({
    radius: 15,
    portcullisWidth: 4,
    portcullisHeight: 7,
    brickDepth: 0.33,
    bricksPerLayer: 16,
    layers: 20,
  });
  // Position keep in front of the user camera (player) when possible
  const playerObj = scene.getObjectByName("player");
  const groundPlacer = getGlobalGroundPlacer(scene);
  if (playerObj) {
    playerObj.updateMatrixWorld();
    const pos = new THREE.Vector3();
    playerObj.getWorldPosition(pos);
    const quat = new THREE.Quaternion();
    playerObj.getWorldQuaternion(quat);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const distance = 3; // meters in front of camera
    const target = pos.clone().add(forward.multiplyScalar(distance));
    groundPlacer.placeObjectAt(keep.group, target);
    // orient the keep to face the player horizontally
    keep.group.lookAt(pos.x, keep.group.position.y, pos.z);
  } else {
    // fallback
    groundPlacer.placeObject(keep.group, -6, 0);
  }
  scene.add(keep.group);
  objects.push(keep.group as any);

  // Add a simple marker cube near the tank
  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xff4444 }),
  );
  groundPlacer.placeObject(mark, 1.5, 0);
  mark.position.y += 0.1; // slight offset above ground
  scene.add(mark);
  objects.push(mark);

  // Lighting for demo
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 10, 7);
  scene.add(dir);
  objects.push(dir);

  const amb = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(amb);
  objects.push(amb);

  // --- Test Sphere for flat ground placement ---
  const testSphere = createTestSphere({ color: 0x0000ff }); // blue sphere for tank demo
  groundPlacer.placeObject(testSphere, -3, 3); // Place at (-3, 3) on ground
  scene.add(testSphere);
  objects.push(testSphere);

  return {
    dispose() {
      for (const o of objects) {
        scene.remove(o);
        // Call dispose() if object exposes it (our tank does)
        (o as any).dispose?.();
        if ((o as any).geometry) (o as any).geometry.dispose?.();
        if ((o as any).material) (o as any).material.dispose?.();
      }
    },
    getSpawnPosition() {
      return new THREE.Vector3(0, 1.2, 3);
    },
  };
}
