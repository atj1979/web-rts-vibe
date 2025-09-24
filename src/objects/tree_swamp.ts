import * as THREE from 'three';
import { createNameSprite } from '../core/nameSprite';

export function createTreeSwamp(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tree_swamp'

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 1.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a3f2a })
  );
  trunk.position.y = 0.5;
  g.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x4b6b3b })
  );
  leaves.position.y = 1.1;
  g.add(leaves);

  // hanging moss
  for (let i = 0; i < 4; i++) {
    const moss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a5b3a })
    );
    moss.position.set(Math.cos(i * Math.PI * 2 / 4) * 0.35, 0.9, Math.sin(i * Math.PI * 2 / 4) * 0.2);
    moss.rotation.x = Math.PI / 2 * 0.8;
    g.add(moss);
  }

  const sprite = createNameSprite('Swamp Tree', Math.floor(Math.random() * 10000));
  sprite.position.set(0, 1.8, 0);
  g.add(sprite);

  return g;
}
