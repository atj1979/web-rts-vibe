import * as THREE from "three";

export function createPanzerTank(): THREE.Group & { setTarget: (target: THREE.Object3D) => void } {
  const tank = new THREE.Group() as THREE.Group & { setTarget: (target: THREE.Object3D) => void };

  // ===== MATERIAL =====
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555, flatShading: true });
  const detailMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true });

  // ===== HULL =====
  const hull = new THREE.Group();
  const hullBody = new THREE.Mesh(new THREE.BoxGeometry(11, 7, 18), baseMat);
  hullBody.position.set(0, 1.5, 0);
  hull.add(hullBody);

  // Sloped glacis (front armor)
  const glacis = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 4), baseMat);
  glacis.position.set(0, 3, -11);
  glacis.rotation.x = -Math.PI / 6; // slope backward
  hull.add(glacis);

  // Rear exhaust boxes
  const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 12), detailMat);
  exhaustL.rotation.z = Math.PI / 2;
  exhaustL.position.set(-3, 2.5, 9.5);
  const exhaustR = exhaustL.clone();
  exhaustR.position.x = 3;
  hull.add(exhaustL, exhaustR);

  tank.add(hull);

  let verticalOffset = 2;
  // ===== TURRET =====
  const turret = new THREE.Group();
  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 2.5, 12), baseMat);
  turretBase.position.set(0, 4.5 + verticalOffset, 0);
  turret.add(turretBase);

  // Mantlet
  const mantlet = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1.5), detailMat);
  mantlet.position.set(0, 4.5 + verticalOffset, -5.8);
  turret.add(mantlet);

  // Gun barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14, 12), detailMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 4.5 + verticalOffset, -12.5);
  turret.add(barrel);

  // Muzzle brake
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8), detailMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 4.5 + verticalOffset, -19.5);
  turret.add(muzzle);

  // Commander’s cupola
  const cupola = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1, 12), detailMat);
  cupola.position.set(2, 6 + verticalOffset, 0);
  turret.add(cupola);

  tank.add(turret);

  // --- Turret/Barrel Targeting Logic ---
  let targetObj: THREE.Object3D | null = null;
  // Store current look direction for lerp




  // Expose setTarget method
  tank.setTarget = (obj: THREE.Object3D) => {
    targetObj = obj;
  };

  // Animation update: call this every frame
  tank.userData.updateTurret = (camera: THREE.Camera) => {
    // If no target, look at camera
    const target = targetObj || camera;
    const targetPos = new THREE.Vector3();
    target.getWorldPosition(targetPos);

    // Turret base: rotate only on Y to face target
    const turretWorldPos = new THREE.Vector3();
    turret.getWorldPosition(turretWorldPos);
    // Project target to same Y as turret (tank turrets rotate horizontally)
    const flatTarget = targetPos.clone();
    flatTarget.y = turretWorldPos.y;
    const turretDir = flatTarget.clone().sub(turretWorldPos).normalize();
    const turretQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      turretDir.lengthSq() > 0.0001 ? turretDir : new THREE.Vector3(0, 0, 1)
    );
    // Lerp turret rotation
    turret.quaternion.slerp(turretQuat, 0.1);

    // Barrel: pitch up/down to target
    // Get local position of target relative to barrel base
    const barrelBase = new THREE.Vector3(0, 4.5 + verticalOffset, 0);
    turret.localToWorld(barrelBase);
    const barrelTargetDir = targetPos.clone().sub(barrelBase).normalize();
    // Project to turret's local XZ plane for yaw, Y for pitch
  // (removed unused turretForward and up)
    // Find pitch angle
    const flatDir = barrelTargetDir.clone();
    flatDir.y = 0;
    flatDir.normalize();
    const pitch = Math.atan2(barrelTargetDir.y, flatDir.length());
    // Set barrel rotation (X axis)
    barrel.rotation.x = Math.PI / 2 - pitch;
  };

  // ===== TRACKS & WHEELS =====
  const tracks = new THREE.Group();
  const wheelCount = 6;
  const wheelSpacing = 3;
  const wheelRadius = 2;

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < wheelCount; i++) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 1, 12), detailMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 5.5, wheelRadius, -10 + i * wheelSpacing);
      tracks.add(wheel);
    }

    // Drive sprocket (front)
    const sprocket = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1.2, 12), detailMat);
    sprocket.rotation.z = Math.PI / 2;
    sprocket.position.set(side * 5.5, 2.5, -11);
    tracks.add(sprocket);

    // Idler wheel (rear)
    const idler = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1.2, 12), detailMat);
    idler.rotation.z = Math.PI / 2;
    idler.position.set(side * 5.5, 2.5, 7);
    tracks.add(idler);

    // Track strip (simplified as a long box)
    const trackStrip = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 22), detailMat);
    trackStrip.position.set(side * 5.5, 2, -2);
    tracks.add(trackStrip);
  }

  tank.add(tracks);
  tank.scale.set(0.1, 0.1, 0.1);

  return tank;
}