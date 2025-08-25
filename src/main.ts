import * as THREE from "three";
// We'll request a custom XR session so we can include `hand-tracking` in optionalFeatures
import { createPerson } from "./objects/person";
import { setupVRHands } from "./controls/vr-hands";
import { createMovementController } from "./controls/movement";
import { COMMIT } from "./commit";

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const userCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.xr.enabled = true;

// Mount the renderer into the #app container so it only takes available size
const appEl = document.getElementById("app")!;
appEl.appendChild(renderer.domElement);

function resizeRendererToDisplaySize() {
  const width = appEl.clientWidth || window.innerWidth;
  const height = appEl.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);
  userCamera.aspect = width / height;
  userCamera.updateProjectionMatrix();
}

// Initial sizing
resizeRendererToDisplaySize();
window.addEventListener("resize", resizeRendererToDisplaySize);

// Add XR entry button that requests hand-tracking when available
if ("xr" in navigator) {
  const xrButton = document.createElement("button");
  xrButton.innerText = "Enter VR (request hand-tracking)";
  xrButton.className = "xr-button";
  xrButton.style.padding = "8px 12px";
  xrButton.style.borderRadius = "6px";
  xrButton.style.background = "#0b84ff";
  xrButton.style.color = "white";
  xrButton.style.border = "none";
  xrButton.style.cursor = "pointer";

  xrButton.onclick = async () => {
    try {
      // Check support then request session with hand-tracking as an optional feature
      const xr: any = (navigator as any).xr;
      const supported =
        (await xr.isSessionSupported) && xr.isSessionSupported("immersive-vr");
      if (!supported) {
        window.alert("Immersive VR not supported on this device.");
        return;
      }

      const session = await xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
      });

      await renderer.xr.setSession(session);
    } catch (err) {
      console.error("Failed to start XR session:", err);
    }
  };

  const ui = document.getElementById("ui") || document.body;
  ui.appendChild(xrButton);
  // Movement toggle button
  const moveToggle = document.createElement("button");
  moveToggle.innerText = "Toggle Movement: ON";
  moveToggle.className = "xr-button";
  moveToggle.style.marginLeft = "8px";
  moveToggle.onclick = () => {
    movement.enabled = !movement.enabled;
    moveToggle.innerText = `Toggle Movement: ${
      movement.enabled ? "ON" : "OFF"
    }`;
  };
  ui.appendChild(moveToggle);
} else {
  // Fallback: show a centered message in the UI overlay
  const fallbackMsg = document.createElement("div");
  fallbackMsg.innerText = "VR not supported. Using standard controls.";
  fallbackMsg.style.background = "rgba(0,0,0,0.7)";
  fallbackMsg.style.color = "white";
  fallbackMsg.style.padding = "8px 16px";
  fallbackMsg.style.borderRadius = "8px";
  const ui = document.getElementById("ui") || document.body;
  ui.appendChild(fallbackMsg);
  // Also add movement toggle in non-XR case
  const moveToggle = document.createElement("button");
  moveToggle.innerText = "Toggle Movement: ON";
  moveToggle.className = "xr-button";
  moveToggle.style.marginTop = "8px";
  moveToggle.onclick = () => {
    movement.enabled = !movement.enabled;
    moveToggle.innerText = `Toggle Movement: ${
      movement.enabled ? "ON" : "OFF"
    }`;
  };
  ui.appendChild(moveToggle);
}

// Create a player group so we can move the player (and keep world objects separate)
const player = new THREE.Group();
player.name = "player";
scene.add(player);

// Add a simple person as a child of player
const person = createPerson();
scene.add(person);

// Camera holder to offset the userCamera relative to player
const cameraHolder = new THREE.Group();
cameraHolder.name = "cameraHolder";
cameraHolder.position.set(0, 0, 0);
player.add(cameraHolder);
cameraHolder.add(userCamera);

// Setup VR hands and controller models (hand-tracking with controller fallback)
const vrHands = setupVRHands(renderer, scene);

// Movement controller (uses vr renderer to read gamepad when in XR)
const movement = createMovementController(player, renderer);

// Log commit hash so deployed builds can be traced
console.log("Build commit:", COMMIT);

// Add a light source for the Phong material
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Position the userCamera a short distance in front of and above the person, looking at the person's center
userCamera.position.set(-2, 2, 7);
userCamera.lookAt(0, 1, 0);

let lastFrameTime = performance.now();

// Animation loop
function renderLoop() {
  person.rotation.y += 0.01;
  // update VR hands visibility/logic if available
  if ((vrHands as any)?.update) {
    (vrHands as any).update();
  }
  // update movement controller (use approximate dt)
  const now = performance.now();
  const last = lastFrameTime || now;
  const dt = Math.min(0.1, (now - last) / 1000);
  lastFrameTime = now;
  if (movement && typeof movement.update === "function") movement.update(dt);
  renderer.render(scene, userCamera);
}

if (renderer.xr.enabled) {
  renderer.setAnimationLoop(renderLoop);
} else {
  function animate() {
    requestAnimationFrame(animate);
    renderLoop();
  }
  animate();
}
