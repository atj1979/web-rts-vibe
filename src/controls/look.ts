import * as THREE from "three";

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
  renderer: THREE.WebGLRenderer,
): LookController {
  const state = {
    enabled: true,
    // radians per second when using keys
    keyRotateSpeed: Math.PI * 2.0, // faster key turning
    // mouse sensitivity multiplier - higher for FPS feel
    mouseSensitivityX: 0.015, // horizontal sensitivity
    mouseSensitivityY: 0.012, // vertical sensitivity (slightly less for comfort)
    invertY: false, // option to invert vertical look
  } as LookController & {
    mouseSensitivityX: number;
    mouseSensitivityY: number;
    keyRotateSpeed: number;
    invertY: boolean;
  };

  let turningLeft = false;
  let turningRight = false;

  // Track pitch on the camera (in radians) and clamp it
  let pitch = camera.rotation.x || 0;
  const PITCH_LIMIT = Math.PI / 2 - 0.1; // allow nearly 90 degrees up/down for FPS feel

  function onMouseMove(e: MouseEvent) {
    // if XR session is active, ignore
    if ((renderer.xr.getSession && renderer.xr.getSession()) || !state.enabled)
      return;
    // only when pointer is locked to the canvas
    const el = renderer.domElement;
    if (document.pointerLockElement !== el) return;

    const dx = e.movementX || 0;
    const dy = e.movementY || 0;

    // Yaw: rotate the player group about Y
    player.rotation.y -= dx * state.mouseSensitivityX;

    // Pitch: rotate the camera locally on X axis
    const pitchDelta = dy * state.mouseSensitivityY * (state.invertY ? -1 : 1);
    pitch -= pitchDelta;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
    camera.rotation.x = pitch;
  }

  function onMouseDown(_e: MouseEvent) {
    // only request pointer lock when not in XR and state enabled
    if ((renderer.xr.getSession && renderer.xr.getSession()) || !state.enabled)
      return;
    const el = renderer.domElement;
    // requestPointerLock will throw a WrongDocumentError if the element
    // has been removed from the DOM (e.g. scene UI teardown). Check that
    // the element is still connected before calling, and guard with try/catch
    // to avoid uncaught exceptions in edge cases.
    const isConnected =
      (el && (el as any).isConnected) || (el && document.contains(el));
    if (el && typeof el.requestPointerLock === "function" && isConnected) {
      try {
        el.requestPointerLock();
      } catch (err) {
        // Non-fatal — log for debugging but don't throw.
        // This avoids the uncaught WrongDocumentError seen when the canvas
        // was removed before pointer lock was requested.
        // eslint-disable-next-line no-console
        console.warn("requestPointerLock failed", err);
      }
    }
  }

  function onPointerLockChange() {
    // nothing required here for now; mousemove handler will gate on pointer lock
  }

  function onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (k === "q") {
      turningLeft = e.type === "keydown";
      if (e.type === "keydown") e.preventDefault();
    } else if (k === "e") {
      turningRight = e.type === "keydown";
      if (e.type === "keydown") e.preventDefault();
    }
  }

  // Register events on the window / canvas
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
  document.addEventListener("pointerlockchange", onPointerLockChange);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);

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
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("pointerlockchange", onPointerLockChange);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKey);
  };

  return state;
}
