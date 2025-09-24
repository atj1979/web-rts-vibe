import * as THREE from 'three';
import { createNameSprite } from '../core/nameSprite';

export function createTreeFruit(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tree_fruit'

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 1.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b4f2b })
  );
  trunk.position.y = 0.55;
  g.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0x4fb64f })
  );
  leaves.position.y = 1.25;
  g.add(leaves);

  // fruits
  for (let i = 0; i < 6; i++) {
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff4d4d })
    );
    const angle = (i / 6) * Math.PI * 2;
    fruit.position.set(Math.cos(angle) * 0.35, 1.25 + Math.sin(angle) * 0.05, Math.sin(angle) * 0.18);
    g.add(fruit);
  }

  const sprite = createNameSprite('Fruit Tree', Math.floor(Math.random() * 10000));
  sprite.position.set(0, 1.9, 0);
  g.add(sprite);

  return g;
}
