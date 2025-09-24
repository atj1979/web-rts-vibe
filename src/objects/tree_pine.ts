import * as THREE from 'three';
import { createNameSprite } from '../core/nameSprite';

export function createTreePine(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tree_pine'

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x5a3f2a })
  );
  trunk.position.y = 0.7;
  g.add(trunk);

  // Conical foliage layers
  for (let i = 0; i < 4; i++) {
    const layer = new THREE.Mesh(
      new THREE.ConeGeometry(0.45 - i * 0.08, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x1f6a1f })
    );
    layer.position.y = 1.2 + i * 0.18;
    g.add(layer);
  }

  const sprite = createNameSprite('Pine Tree', Math.floor(Math.random() * 10000));
  sprite.position.set(0, 2.0, 0);
  g.add(sprite);

  return g;
}
