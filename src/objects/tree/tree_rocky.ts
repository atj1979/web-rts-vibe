import * as THREE from "three";
import { createNameSprite } from "../../core/nameSprite";

export function createTreeRocky(): THREE.Group {
  const g = new THREE.Group();
  g.name = "tree_rocky";

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 1.0, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b4f2b }),
  );
  trunk.position.y = 0.5;
  g.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.65, 0),
    new THREE.MeshStandardMaterial({ color: 0x3b7a3b }),
  );
  leaves.position.y = 1.2;
  g.add(leaves);

  // rock at the base
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.2, 0),
    new THREE.MeshStandardMaterial({ color: 0x808080 }),
  );
  rock.position.set(0.45, 0.12, 0.1);
  g.add(rock);

  const sprite = createNameSprite(
    "Rocky Tree",
    Math.floor(Math.random() * 10000),
  );
  sprite.position.set(0, 1.8, 0);
  g.add(sprite);

  return g;
}
