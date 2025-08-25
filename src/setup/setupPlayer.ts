import * as THREE from "three";
import { setupVRHands } from "../controls/vr-hands";
import { createMovementController } from "../controls/movement";
import { updateManager } from "../setup/updateManager";

/**
 * Sets up the player group, camera holder, and VR hands/controllers.
 * @param renderer The WebGLRenderer (with XR enabled)
 * @param userCamera The main camera to parent under the player
 * @param scene The scene to add the player to
 * @returns { player, userCamera, vrHands }
 */
export function setupPlayer(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  // Create a player group so we can move the player (and keep world objects separate)
  const player = new THREE.Group();
  player.name = "player";
  scene.add(player);

  // Create the user camera
  const userCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Set initial camera position and orientation
  userCamera.position.set(-2, 2, 7);
  userCamera.lookAt(0, 1, 0);
  player.add(userCamera);

  // Setup VR hands and controller models (hand-tracking with controller fallback)
  const vrHands = setupVRHands(renderer, scene);
  // Movement controller (uses vr renderer to read gamepad when in XR)
  const movement = createMovementController(player, renderer);

  // Register per-frame updates with the update manager
  if (movement && typeof movement.update === "function") {
    updateManager.register(movement.update);
  }
  if (vrHands && typeof vrHands.update === "function") {
    updateManager.register(vrHands.update);
  }

  return { player, userCamera, vrHands, movement };
}
