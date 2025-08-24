import * as THREE from 'three';

export function createTreeDead(): THREE.Group {
  const g = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 1.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a3423 })
  );
  trunk.position.y = 0.65;
  g.add(trunk);

  // bare branches using thin cylinders
  for (let i = 0; i < 5; i++) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.03, 0.7, 6),
      new THREE.MeshStandardMaterial({ color: 0x3b2b20 })
    );
    branch.position.set(Math.cos(i) * 0.25, 1.05 + i * 0.02, Math.sin(i) * 0.1);
    branch.rotation.z = Math.PI / 4 * (i % 2 === 0 ? 1 : -1);
    g.add(branch);
  }

  return g;
}
