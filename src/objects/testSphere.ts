import * as THREE from "three";
import { createNameSprite } from "../core/nameSprite";

/**
 * Designer_3d style: Simple procedural sphere for testing ground placement.
 * Creates a basic sphere with a name sprite for identification.
 */
export function createTestSphere(params = {}) {
  const opts = Object.assign(
    {
      radius: 0.5,
      color: 0x00ff00, // green for testing
      segments: 16,
    },
    params,
  );

  const group = new THREE.Group();
  group.name = "testSphere";

  // Create sphere geometry and material
  const geometry = new THREE.SphereGeometry(
    opts.radius,
    opts.segments,
    opts.segments,
  );
  const material = new THREE.MeshStandardMaterial({
    color: opts.color,
    roughness: 0.7,
    metalness: 0.1,
  });

  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  // Add identification sprite
  const sprite = createNameSprite(
    "Test Sphere",
    Math.floor(Math.random() * 10000),
  );
  sprite.position.set(0, opts.radius + 0.3, 0);
  group.add(sprite);

  return group;
}
