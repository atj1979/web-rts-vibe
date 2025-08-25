/**
 * Scene Switcher System
 *
 * Requirements:
 * 1. The user should be able to switch scenes from a UI that is attached to the left wrist (VR controller).
 * 2. When a scene is switched, all components from the previous scene are properly cleaned up and disposed.
 * 3. When the user loads into the scene, that is when the position of the user should be determined (scene provides spawn logic).
 *
 * Design:
 * - Each scene is registered with a name, a setup function (which returns a cleanup/dispose function and a getSpawnPosition function), and an optional icon/label for the UI.
 * - The switcher manages adding/removing all scene objects and UI.
 * - The UI for switching scenes will be attached to the left wrist (controller) in VR, or as a fallback, to the DOM in desktop mode.
 * - The switcher ensures only one scene is active at a time.
 */

import * as THREE from "three";
import { eventBus } from "./core/eventBus";
import { store } from "./core/store";

export type SceneSetupResult = {
  dispose: () => void;
  getSpawnPosition: () => THREE.Vector3;
};

export type SceneSetupFn = (scene: THREE.Scene) => SceneSetupResult;

export class SceneSwitcher {
  private scenes: { name: string; setup: SceneSetupFn }[] = [];
  private currentSceneIdx: number = -1;
  private currentCleanup: (() => void) | null = null;
  private currentGetSpawn: (() => THREE.Vector3) | null = null;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Listen for scene:switch events
    eventBus.on<number>("scene:switch", (idx) => {
      this.switchTo(idx);
    });
  }

  registerScene(name: string, setup: SceneSetupFn) {
    this.scenes.push({ name, setup });
  }

  switchTo(idx: number) {
    if (idx === this.currentSceneIdx) return;
    // Cleanup previous scene
    if (this.currentCleanup) this.currentCleanup();
    this.currentCleanup = null;
    this.currentGetSpawn = null;
    // Setup new scene
    const entry = this.scenes[idx];
    if (!entry) return;
    const result = entry.setup(this.scene);
    this.currentCleanup = result.dispose;
    this.currentGetSpawn = result.getSpawnPosition;
    this.currentSceneIdx = idx;
    // Update global store
    store.set({
      currentSceneIdx: idx,
      userSpawn: this.getSpawnPosition().clone(),
    });
    // Optionally emit event for scene changed
    eventBus.emit("scene:changed", idx);
  }

  getSpawnPosition(): THREE.Vector3 {
    if (this.currentGetSpawn) return this.currentGetSpawn();
    return new THREE.Vector3(0, 0, 0);
  }

  // Placeholder: attach UI to left wrist (to be implemented)
  attachUIToLeftWrist() {
    // TODO: Implement VR wrist UI for scene switching
    // For now, fallback to DOM UI for desktop
    const dom = document.createElement("div");
    dom.style.position = "absolute";
    dom.style.left = "16px";
    dom.style.top = "16px";
    dom.style.background = "rgba(0,0,0,0.7)";
    dom.style.color = "white";
    dom.style.padding = "8px";
    dom.style.borderRadius = "8px";
    dom.style.zIndex = "1000";
    dom.innerText = "Scene Switcher:";
    this.scenes.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.innerText = s.name;
      btn.style.margin = "4px";
      btn.onclick = () => eventBus.emit("scene:switch", i);
      dom.appendChild(btn);
    });
    document.body.appendChild(dom);
  }
}
