import * as THREE from "three";
// We'll request a custom XR session so we can include `hand-tracking` in optionalFeatures
import { setupPlayer } from "./setup/setupPlayer";
import { SceneSwitcher } from "./sceneSwitcher";
import { addBasicWorld } from "./scenes/basicWorld";
import { addVariedLandscape } from "./scenes/variedLandscape";
import { addTankDemo } from "./scenes/tankDemo";
import { COMMIT } from "./commit";
import { setupResizeListener } from "./setup/resizeListener";
import { updateManager } from "./setup/updateManager";
import { eventBus } from "./core/eventBus";
import { createVRDebugPanel } from "./core/vrDebugPanel";
import { setupVRMenu } from "./ui/vrMenu";
import { getCurrentGlobalGroundPlacer } from "./core/groundPlacement";

// Create scene and renderer
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.xr.enabled = true;

// Mount the renderer into the #app container so it only takes available size
const appEl = document.getElementById("app")!;
appEl.appendChild(renderer.domElement);

// Create FPS counter display
const fpsCounter = document.createElement('div');
fpsCounter.style.position = 'fixed';
fpsCounter.style.top = '10px';
fpsCounter.style.right = '10px';
fpsCounter.style.background = 'rgba(0, 0, 0, 0.7)';
fpsCounter.style.color = 'white';
fpsCounter.style.padding = '5px 10px';
fpsCounter.style.borderRadius = '5px';
fpsCounter.style.fontFamily = 'monospace';
fpsCounter.style.fontSize = '14px';
fpsCounter.style.zIndex = '1000';
fpsCounter.textContent = 'FPS: --';
document.body.appendChild(fpsCounter);

// FPS tracking variables
let frameCount = 0;
let lastFpsUpdate = performance.now();
let fps = 0;

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
}

const { userCamera, player } = setupPlayer(renderer, scene);
// Create in-VR debug panel (pass camera so it always faces user)
createVRDebugPanel(scene, player, userCamera);

// --- Scene Switcher Setup ---
const sceneSwitcher = new SceneSwitcher(scene);
// Register Basic World first so index 0 opens it by default
sceneSwitcher.registerScene("Basic World", addBasicWorld);
sceneSwitcher.registerScene("Tank Demo", addTankDemo);
sceneSwitcher.registerScene("Varied Landscape", addVariedLandscape);
sceneSwitcher.switchTo(0); // Start with Basic World
sceneSwitcher.attachUIToLeftWrist();

// Set user/player position after scene load
const setPlayerToSceneSpawn = () => {
  const spawn = sceneSwitcher.getSpawnPosition();
  if (player) {
    const groundPlacer = getCurrentGlobalGroundPlacer();
    if (groundPlacer) {
      const groundHeight = groundPlacer.getGroundHeight(spawn.x, spawn.z);
      player.position.set(spawn.x, groundHeight + 1.7, spawn.z);
    } else {
      // Fallback if ground placer not ready
      player.position.set(spawn.x, spawn.y, spawn.z);
    }
  }
};
setPlayerToSceneSpawn();
setupResizeListener({
  renderer,
  camera: userCamera,
  parentEl: appEl,
});

const vrMenuController = setupVRMenu({
  sceneSwitcher,
  renderer,
  camera: userCamera,
  player,
});

// Ensure we clean up global listeners/hint on page unload
window.addEventListener("beforeunload", () => {
  if (
    vrMenuController &&
    typeof (vrMenuController as any).dispose === "function"
  ) {
    (vrMenuController as any).dispose();
  }
});
window.addEventListener("unload", () => {
  if (
    vrMenuController &&
    typeof (vrMenuController as any).dispose === "function"
  ) {
    (vrMenuController as any).dispose();
  }
});

// Dispose VR menu when switching scenes so scene-specific UI is cleaned up
eventBus.on<number>('scene:switch', () => {
  if (vrMenuController && typeof (vrMenuController as any).dispose === 'function') {
    (vrMenuController as any).dispose();
  }
});

// Log commit hash so deployed builds can be traced
console.log("Build commit:", COMMIT);

// Add a light source for the Phong material
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

let lastFrameTime = performance.now();

// Animation loop

function renderLoop() {
  // Always use the update manager for per-frame logic!
  const now = performance.now();
  const last = lastFrameTime || now;
  const dt = Math.min(0.1, (now - last) / 1000);
  lastFrameTime = now;

  // Update FPS counter
  frameCount++;
  if (now - lastFpsUpdate >= 1000) { // Update every second
    fps = Math.round(frameCount * 1000 / (now - lastFpsUpdate));
    fpsCounter.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastFpsUpdate = now;
  }

  updateManager.updateAll({ deltaTime: dt });
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
