import * as THREE from "three";
import { createNameSprite } from "../../core/nameSprite";

export function createTreeBlossom(): THREE.Group {
  const g = new THREE.Group();
  g.name = "tree_blossom";

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 1.1, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b4f2b }),
  );
  trunk.position.y = 0.55;
  g.add(trunk);

  // blossom canopy using several small spheres
  const canopy = new THREE.Group();
  const colors = [0xffc0cb, 0xffe4e1, 0xffb6c1];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 12),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length] }),
    );
    const angle = (i / 6) * Math.PI * 2;
    s.position.set(
      Math.cos(angle) * 0.4,
      1.05 + Math.sin(angle) * 0.05,
      Math.sin(angle) * 0.25,
    );
    canopy.add(s);
  }
  g.add(canopy);

  const sprite = createNameSprite(
    "Blossom Tree",
    Math.floor(Math.random() * 10000),
  );
  sprite.position.set(0, 1.8, 0);
  g.add(sprite);

  return g;
}
