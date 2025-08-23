import * as THREE from 'three';

/**
 * Creates a simple person model using basic Three.js shapes.
 * The person consists of a sphere (head), cylinder (body), and cylinders (arms, legs).
 */
export function createPerson(): THREE.Group {
  const person = new THREE.Group();

  // Head
  const headGeometry = new THREE.SphereGeometry(0.25, 32, 32);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.5;
  person.add(head);

  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.7, 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4682b4 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1;
  person.add(body);

  // Left Arm
  const armGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.32, 1.2, 0);
  leftArm.rotation.z = Math.PI / 6;
  person.add(leftArm);

  // Right Arm
  const rightArm = leftArm.clone();
  rightArm.position.set(0.32, 1.2, 0);
  rightArm.rotation.z = -Math.PI / 6;
  person.add(rightArm);

  // Left Leg
  const legGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 16);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.13, 0.35, 0);
  person.add(leftLeg);

  // Right Leg
  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.13, 0.35, 0);
  person.add(rightLeg);

  return person;
}
