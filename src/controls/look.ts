import * as THREE from 'three';

type LookController = {
  enabled: boolean;
  update: (dt: number) => void;
  dispose: () => void;
};

/**
 * Simple first-person look controller.
 * - Left/Right mouse (when pointer locked) rotates player yaw
 * - Up/Down mouse rotates camera pitch (clamped)
 * - Q / E keys rotate player when pointer is not locked
 * - Disabled automatically when an XR session is active (so VR controllers control view)
 */
export function createLookController(
  player: THREE.Object3D,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer
): LookController {
  const state = {
    enabled: true,
    // radians per second when using keys
    keyRotateSpeed: Math.PI * 0.9,
    // mouse sensitivity multiplier
    mouseSensitivity: 0.0025,
  } as LookController & { mouseSensitivity: number; keyRotateSpeed: number };

  let turningLeft = false;
  let turningRight = false;

  // Track pitch on the camera (in radians) and clamp it
  let pitch = (camera.rotation.x || 0);
  const PITCH_LIMIT = Math.PI / 2 - 0.05; // slightly less than +/-90deg

  function onMouseMove(e: MouseEvent) {
    // if XR session is active, ignore
    if ((renderer.xr.getSession && renderer.xr.getSession()) || !state.enabled) return;
    // only when pointer is locked to the canvas
    const el = renderer.domElement;
    if (document.pointerLockElement !== el) return;

    const dx = e.movementX || 0;
    const dy = e.movementY || 0;

    // Yaw: rotate the player group about Y
    player.rotation.y -= dx * state.mouseSensitivity;

    // Pitch: rotate the camera locally on X axis
    pitch -= dy * state.mouseSensitivity;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    camera.rotation.x = pitch;
  }

  function onMouseDown(_e: MouseEvent) {
    // only request pointer lock when not in XR and state enabled
    if ((renderer.xr.getSession && renderer.xr.getSession()) || !state.enabled) return;
    const el = renderer.domElement;
    if (el && typeof el.requestPointerLock === 'function') {
      el.requestPointerLock();
    }
  }

  function onPointerLockChange() {
    // nothing required here for now; mousemove handler will gate on pointer lock
  }

  function onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (k === 'q') {
      turningLeft = e.type === 'keydown';
      if (e.type === 'keydown') e.preventDefault();
    } else if (k === 'e') {
      turningRight = e.type === 'keydown';
      if (e.type === 'keydown') e.preventDefault();
    }
  }

  // Register events on the window / canvas
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  state.update = function (dt: number) {
    if (!state.enabled) return;
    // Disable look while in XR session
    if (renderer.xr.getSession && renderer.xr.getSession()) return;

    if (turningLeft) {
      player.rotation.y += state.keyRotateSpeed * dt;
    }
    if (turningRight) {
      player.rotation.y -= state.keyRotateSpeed * dt;
    }
  } as any;

  state.dispose = function () {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
  };

  return state;
}
