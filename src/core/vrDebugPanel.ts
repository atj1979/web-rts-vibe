import * as THREE from "three";

let panelMesh: THREE.Mesh | null = null;
let panelUpdateFn: (() => void) | null = null;
let debugLines: THREE.Line[] = [];
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let texture: THREE.CanvasTexture | null = null;

export function createVRDebugPanel(
  scene: THREE.Scene,
  player: THREE.Object3D,
  camera?: THREE.Camera,
) {
  if (panelMesh) return panelMesh;
  canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  ctx = canvas.getContext("2d");
  texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const geo = new THREE.PlaneGeometry(1.2, 0.4);
  panelMesh = new THREE.Mesh(geo, mat);
  panelMesh.renderOrder = 9999;
  panelMesh.name = "VRDebugPanel";
  // Initial placement (will be updated per-frame)
  panelMesh.position.set(0, 1.7, -2.2);

  scene.add(panelMesh);

  // (debug box removed)

  // Add 20 lines from high up to the panel location
  const lineMat = new THREE.LineBasicMaterial({ color: 0xff00ff });
  debugLines = [];
  for (let i = 0; i < 20; ++i) {
    // Spread lines in a circle above the panel
    const angle = (i / 20) * Math.PI * 2;
    const radius = 1.5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const start = new THREE.Vector3(x, 6, z);
    // If there is a keep object in the scene, point lines at it; otherwise to the panel
    const keepObj = scene.getObjectByName("keep");
    let end: THREE.Vector3;
    if (keepObj) {
      keepObj.updateMatrixWorld();
      end = new THREE.Vector3();
      keepObj.getWorldPosition(end);
    } else {
      end = panelMesh.position.clone();
    }
    const points = [start, end];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geom, lineMat);
    line.name = "VRDebugPanelLine";
    scene.add(line);
    debugLines.push(line);
  }

  // Add per-frame update to keep panel in front of camera/player and update lines
  let lastTime = performance.now();
  panelUpdateFn = () => {
    if (!panelMesh) return;
    // If camera is provided, use its world position and quaternion
    let refObj = camera || player;
    refObj.updateMatrixWorld();
    // Place panel 1.5m in front of camera/player at eye height
    const eyeHeight = 1.7;
    const dist = 2.2;
    const camWorldPos = new THREE.Vector3();
    refObj.getWorldPosition(camWorldPos);
    const camWorldQuat = new THREE.Quaternion();
    refObj.getWorldQuaternion(camWorldQuat);
    // Forward vector
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camWorldQuat);
    const panelPos = camWorldPos.clone().add(forward.multiplyScalar(dist));
    panelPos.y = camWorldPos.y + (eyeHeight - camWorldPos.y); // keep at eye height
    panelMesh.position.copy(panelPos);
    panelMesh.quaternion.copy(camWorldQuat);

    // Rotate panel about Y axis (vertical) at 10 degrees per second
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    const degPerSec = 10;
    const rad = THREE.MathUtils.degToRad(degPerSec * dt);
    panelMesh.rotateY(rad);

    // Update lines to point to the keep (if present) or panel position
    const keepObj = scene.getObjectByName("keep");
    let targetPos = panelMesh.position.clone();
    if (keepObj) {
      keepObj.updateMatrixWorld();
      keepObj.getWorldPosition(targetPos);
    }
    for (let i = 0; i < debugLines.length; ++i) {
      const angle = (i / debugLines.length) * Math.PI * 2;
      const radius = 1.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const start = new THREE.Vector3(x, 6, z);
      const end = targetPos.clone();
      const points = [start, end];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      debugLines[i].geometry.dispose();
      debugLines[i].geometry = geom;
    }
  };
  // Register with updateManager if available (avoid circular import)
  if (typeof window !== "undefined" && (window as any).updateManager) {
    (window as any).updateManager.register(panelUpdateFn);
  } else if (
    typeof globalThis !== "undefined" &&
    (globalThis as any).updateManager
  ) {
    (globalThis as any).updateManager.register(panelUpdateFn);
  }
  return panelMesh;
}

export function vrDebugLog(msg: string) {
  if (!ctx || !canvas || !texture) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,1.0)"; // fully opaque for visibility
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ff00";
  ctx.font = "24px monospace";
  ctx.fillText(msg, 16, 64);
  texture.needsUpdate = true;
}

export function removeVRDebugPanel(scene: THREE.Scene) {
  if (panelMesh) {
    scene.remove(panelMesh);
    panelMesh.geometry.dispose();
    if (Array.isArray(panelMesh.material)) {
      panelMesh.material.forEach((m) => m.dispose());
    } else {
      panelMesh.material.dispose();
    }
    // Remove and dispose lines
    for (const line of debugLines) {
      scene.remove(line);
      line.geometry.dispose();
    }
    // Remove debug box
    const debugBox = scene.getObjectByName("VRDebugPanelDebugBox");
    if (debugBox) {
      scene.remove(debugBox);
      if ((debugBox as THREE.Mesh).geometry)
        (debugBox as THREE.Mesh).geometry.dispose();
      if ((debugBox as THREE.Mesh).material)
        ((debugBox as THREE.Mesh).material as any).dispose();
    }
    debugLines = [];
    panelMesh = null;
    canvas = null;
    ctx = null;
    texture = null;
    // Unregister update
    if (
      typeof window !== "undefined" &&
      (window as any).updateManager &&
      panelUpdateFn
    ) {
      (window as any).updateManager.unregister(panelUpdateFn);
    } else if (
      typeof globalThis !== "undefined" &&
      (globalThis as any).updateManager &&
      panelUpdateFn
    ) {
      (globalThis as any).updateManager.unregister(panelUpdateFn);
    }
    panelUpdateFn = null;
  }
}
