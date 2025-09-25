import * as THREE from "three";

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
  head.position.y = 1.65;
  person.add(head);

  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.035, 16, 16);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.07, 1.7, 0.22);
  const rightEye = leftEye.clone();
  rightEye.position.set(0.07, 1.7, 0.22);
  person.add(leftEye);
  person.add(rightEye);

  // Nose
  const noseGeometry = new THREE.ConeGeometry(0.025, 0.08, 8);
  const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.set(0, 1.66, 0.25);
  nose.rotation.x = Math.PI / 2;
  person.add(nose);

  // Mouth
  const mouthGeometry = new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI);
  const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0xaa3333 });
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, 1.62, 0.22);
  mouth.rotation.x = Math.PI / 2;
  person.add(mouth);

  // Neck
  const neckGeometry = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16);
  const neckMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const neck = new THREE.Mesh(neckGeometry, neckMaterial);
  neck.position.y = 1.52;
  person.add(neck);

  // Body (shirt)
  const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.7, 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4682b4 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1.1;
  person.add(body);

  // Belt
  const beltGeometry = new THREE.TorusGeometry(0.2, 0.025, 8, 24);
  const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const belt = new THREE.Mesh(beltGeometry, beltMaterial);
  belt.position.y = 0.78;
  belt.rotation.x = Math.PI / 2;
  person.add(belt);

  // Arm/Hand geometry/materials
  const sleeveGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16);
  const sleeveMaterial = new THREE.MeshStandardMaterial({ color: 0x4682b4 });
  const armGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.38, 16);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
  const handGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const handMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd });

  // Shoulder parameters
  const shoulderY = 1.45; // slightly below the head, top of body
  const shoulderOffset = 0.25 + 0.09; // body radius + sleeve radius

  // Left Arm Group
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-shoulderOffset, shoulderY, 0);
  leftArmGroup.rotation.z = Math.PI / 6;

  const leftSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
  leftSleeve.position.set(0, -0.11, 0);
  leftArmGroup.add(leftSleeve);

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(0, -0.32, 0);
  leftArmGroup.add(leftArm);

  const leftHand = new THREE.Mesh(handGeometry, handMaterial);
  leftHand.position.set(0, -0.56, 0);
  leftArmGroup.add(leftHand);

  person.add(leftArmGroup);

  // Right Arm Group
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(shoulderOffset, shoulderY, 0);
  rightArmGroup.rotation.z = -Math.PI / 6;

  const rightSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
  rightSleeve.position.set(0, -0.11, 0);
  rightArmGroup.add(rightSleeve);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0, -0.32, 0);
  rightArmGroup.add(rightArm);

  const rightHand = new THREE.Mesh(handGeometry, handMaterial);
  rightHand.position.set(0, -0.56, 0);
  rightArmGroup.add(rightHand);

  person.add(rightArmGroup);

  // Left Leg (pants + leg)
  const pantsGeometry = new THREE.CylinderGeometry(0.11, 0.11, 0.32, 16);
  const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0x222288 });
  const leftPants = new THREE.Mesh(pantsGeometry, pantsMaterial);
  leftPants.position.set(-0.13, 0.55, 0);
  person.add(leftPants);

  const legGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.38, 16);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.13, 0.35, 0);
  person.add(leftLeg);

  // Left Foot
  const footGeometry = new THREE.BoxGeometry(0.13, 0.06, 0.22);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
  leftFoot.position.set(-0.13, 0.13, 0.07);
  person.add(leftFoot);

  // Right Leg (pants + leg)
  const rightPants = leftPants.clone();
  rightPants.position.set(0.13, 0.55, 0);
  person.add(rightPants);

  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.13, 0.35, 0);
  person.add(rightLeg);

  // Right Foot
  const rightFoot = leftFoot.clone();
  rightFoot.position.set(0.13, 0.13, 0.07);
  person.add(rightFoot);

  return person;
}
