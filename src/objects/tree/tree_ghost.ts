import * as THREE from 'three';
import { createNameSprite } from '../../core/nameSprite';

export function createTreeGhost(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tree_ghost'

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x3b2b3b, transparent: true, opacity: 0.6 })
  );
  trunk.position.y = 0.6;
  g.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x7f7fff, transparent: true, opacity: 0.35 })
  );
  leaves.position.y = 1.4;
  g.add(leaves);

  // eerie floating particle
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xaaffff, emissive: 0x66ffff })
  );
  orb.position.set(0.25, 1.0, 0.15);
  g.add(orb);

  const sprite = createNameSprite('Ghost Tree', Math.floor(Math.random() * 10000));
  sprite.position.set(0, 1.9, 0);
  g.add(sprite);

  return g;
}
