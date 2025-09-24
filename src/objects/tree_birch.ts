import * as THREE from 'three';
import { createNameSprite } from '../core/nameSprite';

export function createTreeBirch(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tree_birch'

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xf0e6d6 })
  );
  trunk.position.y = 0.6;

  // add birch markings using a simple texture-like approach with small boxes
  for (let i = 0; i < 6; i++) {
    const mark = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.06, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    mark.position.set(0.07, 1 - i * 0.15, 0.06 * (i % 2 === 0 ? 1 : -1));
    mark.rotation.z = 0.2 * (i % 2 === 0 ? 1 : -1);
    g.add(mark);
  }

  g.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0x5fb65f })
  );
  leaves.position.y = 1.4;
  g.add(leaves);

  const sprite = createNameSprite('Birch Tree', Math.floor(Math.random() * 10000));
  sprite.position.set(0, 2.0, 0);
  g.add(sprite);

  return g;
}
