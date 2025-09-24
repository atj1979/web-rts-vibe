import * as THREE from 'three';
import { createNameSprite } from '../../core/nameSprite';

export function createTreeOak(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tree_oak'

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 1.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b4f2b })
  );
  trunk.position.y = 0.6;
  g.add(trunk);

  // Foliage - big rounded canopy
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x2f7a2f })
  );
  leaves.position.y = 1.45;
  g.add(leaves);

  // small low bush at base
  const bush = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x2f6a2f })
  );
  bush.position.set(0.4, 0.18, -0.2);
  g.add(bush);

  // attach name sprite
  const sprite = createNameSprite('Oak Tree', Math.floor(Math.random() * 10000));
  sprite.position.set(0, 2.2, 0);
  g.add(sprite);

  return g;
}
