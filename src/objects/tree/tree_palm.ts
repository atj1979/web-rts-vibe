import * as THREE from "three";
import { createNameSprite } from "../../core/nameSprite";

export function createTreePalm(): THREE.Group {
  const g = new THREE.Group();
  g.name = "tree_palm";

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b }),
  );
  trunk.position.y = 0.8;
  trunk.rotation.z = 0.04;
  g.add(trunk);

  // Palm leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2fa84f });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.8, 0.15),
      leafMat,
    );
    leaf.position.y = 1.5;
    leaf.rotation.z = (i / 6) * Math.PI * 2;
    leaf.rotation.x = -Math.PI / 6;
    g.add(leaf);
  }

  const sprite = createNameSprite(
    "Palm Tree",
    Math.floor(Math.random() * 10000),
  );
  sprite.position.set(0, 2.2, 0);
  g.add(sprite);

  return g;
}
