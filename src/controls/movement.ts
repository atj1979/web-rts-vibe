import * as THREE from 'three';

/**
 * Movement controller.
 * - Supports VR left-controller thumbstick (gamepad axes) when available.
 * - Falls back to WASD / arrow keys on desktop.
 * - Switchable on/off via `enabled` property.
 *
 * Contract (inputs/outputs):
 * - createMovementController(player: THREE.Object3D, renderer: THREE.WebGLRenderer)
 *   returns { enabled, speed, update, dispose }
 *
 * Data shapes:
 * - speed: number (meters per second)
 * - enabled: boolean
 */

type MovementController = {
  enabled: boolean;
  speed: number;
  update: (timeSinceLastFrame: number) => void;
  dispose: () => void;
};

export function createMovementController(player: THREE.Object3D, renderer: THREE.WebGLRenderer): MovementController {
  const state = {
    enabled: true,
    speed: 2.5, // m/s
  } as MovementController;

  // Keyboard fallback state
  const keys: Record<string, boolean> = {};
  function onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      if (e.type === 'keydown') keys[k] = true;
      else if (e.type === 'keyup') keys[k] = false;
      e.preventDefault();
    }
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  // Helper to read left gamepad axes from XR controllers
  function getLeftThumbstick() {
    const session = renderer.xr.getSession();
    if (!session) return null;
    const inputSources = Array.from(session.inputSources || []) as any[];
    for (const s of inputSources) {
      if (s.handedness === 'left' && s.gamepad) {
        const gp = s.gamepad as Gamepad;
        // standard mapping: axes[2]=x, axes[3]=y OR axes[0]=x, axes[1]=y depending on controller
        // prefer thumbstick-like axes with magnitude
        if (gp.axes.length >= 2) {
          // Try to pick the axes that look like a thumbstick: prefer last two if more than 2
          const lx = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0];
          const ly = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1];
          return { x: lx, y: ly };
        }
      }
    }
    return null;
  }

  // Update: call every frame with timeSinceLastFrame seconds
  state.update = function (timeSinceLastFrame: number) {
    if (!state.enabled) return;

    // Movement vector in local XZ plane
    const move = new THREE.Vector3();

    // First try VR left thumbstick
    const thumb = getLeftThumbstick();
    if (thumb) {
      // Deadzone
      const dead = 0.15;
      const tx = Math.abs(thumb.x) > dead ? thumb.x : 0;
      const ty = Math.abs(thumb.y) > dead ? thumb.y : 0;
      // Forward is -y on many controllers, so invert Y
      move.x += tx;
      move.z += ty;
    } else {
      // Keyboard fallback
      if (keys['w'] || keys['arrowup']) move.z -= 1;
      if (keys['s'] || keys['arrowdown']) move.z += 1;
      if (keys['a'] || keys['arrowleft']) move.x -= 1;
      if (keys['d'] || keys['arrowright']) move.x += 1;
    }

    if (move.lengthSq() < 1e-6) return;

    // Normalize and scale by speed * timeSinceLastFrame
    move.normalize().multiplyScalar(state.speed * timeSinceLastFrame);

    // Apply movement in the horizontal plane relative to player's rotation
    const quat = new THREE.Quaternion();
    player.getWorldQuaternion(quat);
    // Project quaternion to yaw only (ignore pitch/roll)
    const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
    const yawQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, euler.y, 0));
    move.applyQuaternion(yawQuat);

    // Update player position
    player.position.add(move);
  } as any;

  state.dispose = function () {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
  };

  return state;
}
