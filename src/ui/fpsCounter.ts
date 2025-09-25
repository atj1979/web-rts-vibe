import { updateManager } from "../setup/updateManager";

export function createFPSCounter() {
  const fpsCounter = document.createElement("div");
  fpsCounter.className = "fps-counter";
  // inline styles (moved from separate CSS file)
  fpsCounter.style.position = "fixed";
  fpsCounter.style.top = "10px";
  fpsCounter.style.right = "10px";
  fpsCounter.style.background = "rgba(0, 0, 0, 0.7)";
  fpsCounter.style.color = "white";
  fpsCounter.style.padding = "5px 10px";
  fpsCounter.style.borderRadius = "5px";
  fpsCounter.style.fontFamily = "monospace";
  fpsCounter.style.fontSize = "14px";
  fpsCounter.style.zIndex = "1000";
  fpsCounter.textContent = "FPS: --";
  document.body.appendChild(fpsCounter);

  let frameCount = 0;
  let lastUpdate = performance.now();

  function tick() {
    // updateManager provides deltaTime but we only need frame counting
    frameCount += 1; // count frames
    const now = performance.now();
    const elapsed = now - lastUpdate;
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount * 1000) / elapsed);
      fpsCounter.textContent = `FPS: ${fps}`;
      frameCount = 0;
      lastUpdate = now;
    }
  }

  const unregister = updateManager.register(tick);

  function dispose() {
    unregister();
    if (fpsCounter.parentElement)
      fpsCounter.parentElement.removeChild(fpsCounter);
  }

  return { el: fpsCounter, dispose };
}
