import * as THREE from "three";
import { SceneSwitcher } from "../sceneSwitcher";
import { vrDebugLog } from "../core/vrDebugPanel";

/**
 * VR Menu system: shows a 3D menu in front of the user when the left controller's menu button is pressed.
 * - Buttons for each scene (calls sceneSwitcher.switchTo)
 * - Menu appears ~1.5m in front of the camera/player
 * - Simple clickable mesh buttons (raycast/collision, not pointer events)
 */
export function setupVRMenu({
  sceneSwitcher,
  renderer,
  camera,
  menuTarget,
  // Optional keyboard config
  keyboardToggleKey = "m",
  keyboardHideKey = "Escape",
  showKeyboardHint = true,
}: {
  sceneSwitcher: SceneSwitcher;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  menuTarget: { getObject3D: () => THREE.Object3D };
  keyboardToggleKey?: string;
  keyboardHideKey?: string;
  showKeyboardHint?: boolean;
}) {
  let menuPanel: THREE.Group | null = null;
  let menuVisible = true;
  let lastMenuButtonState = false;
  let disposed = false;

  // Create menu panel (call when showing)
  function createMenuPanel() {
    const group = new THREE.Group();
    // Panel background
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.3),
      new THREE.MeshBasicMaterial({
        color: 0x222244,
        opacity: 0.92,
      })
    );
    bg.position.z = -0.01;
    group.add(bg);
    // Scene buttons
    const btnWidth = 0.5,
      btnHeight = 0.08,
      btnGap = 0.1;
    sceneSwitcher["scenes"].forEach((_s, i) => {
      const btn = new THREE.Mesh(
        new THREE.PlaneGeometry(btnWidth, btnHeight),
        new THREE.MeshBasicMaterial({ color: 0x4488ff })
      );
      btn.position.set(0, 0.08 - i * btnGap, 0);
      // Add text label (simple, not real 3D text)
      // Optionally use a canvas texture for real text
      btn.userData.sceneIdx = i;
      group.add(btn);
    });
    return group;
  }

  // Show menu in front of user
  function showMenu() {
    vrDebugLog("VR Menu: showMenu called");
    if (menuPanel) return;
    menuPanel = createMenuPanel();
    // Place in front of menuTarget (can be player, tank, etc)
    const dist = 1.5;
    const pos = new THREE.Vector3(0, 1.5, -dist);
    const targetObj = menuTarget.getObject3D();
    pos.applyMatrix4(targetObj.matrixWorld);
    menuPanel.position.copy(pos);
    // Face the camera
    menuPanel.quaternion.copy(camera.quaternion);
    sceneSwitcher["scene"].add(menuPanel);
    menuVisible = true;
    vrDebugLog("VR Menu: menuPanel added to scene");
  }

  function hideMenu() {
    vrDebugLog("VR Menu: hideMenu called");
    if (menuPanel) {
      sceneSwitcher["scene"].remove(menuPanel);
      menuPanel = null;
    }
    menuVisible = false;
    vrDebugLog("VR Menu: menuPanel removed from scene");
  }

  // Raycast for button clicks (very basic, assumes right controller as pointer)
  function checkMenuInteraction(xrFrame: XRFrame) {
    if (!menuPanel) return;
    // Use right controller as pointer
    const session = renderer.xr.getSession();
    if (!session) return;
    const inputSources = Array.from(session.inputSources || []);
    const right = inputSources.find((s) => s.handedness === "right");
    if (!right || !right.targetRaySpace) return;
    // Get controller pose
    const refSpace = renderer.xr.getReferenceSpace();
    if (!refSpace) return;
    const pose = xrFrame.getPose(right.targetRaySpace, refSpace);
    if (!pose) return;
    // Ray origin/direction
    const pos = pose.transform.position;
    const origin = new THREE.Vector3().fromArray([pos.x, pos.y, pos.z]);
    const orientation = pose.transform.orientation;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
      new THREE.Quaternion(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w
      )
    );
    // Raycast against menu buttons
    const ray = new THREE.Ray(origin, dir);
    for (const child of menuPanel!.children) {
      if (child.userData.sceneIdx !== undefined) {
        const box = new THREE.Box3().setFromObject(child);
        if (ray.intersectsBox(box)) {
          // Switch scene and hide menu
          sceneSwitcher.switchTo(child.userData.sceneIdx);
          hideMenu();
          break;
        }
      }
    }
  }

  // Listen for left controller menu button
  renderer.setAnimationLoop((_, xrFrame?: XRFrame) => {
    if (disposed) return;
    const session = renderer.xr.getSession();
    if (!session) {
      vrDebugLog("VR Menu: No XR session");
      return;
    }
    const inputSources = Array.from(session.inputSources || []);
    vrDebugLog("VR Menu: inputSources=" + inputSources.length);
    const left = inputSources.find((s) => s.handedness === "left" && s.gamepad);
    if (!left || !left.gamepad) {
      vrDebugLog("VR Menu: No left controller with gamepad");
      return;
    }
    // Menu button is usually button[3] or [4] (varies by controller)
    const menuBtn = left.gamepad.buttons[3] || left.gamepad.buttons[4];
    vrDebugLog(
      "VR Menu: menuBtn=" + (menuBtn ? JSON.stringify(menuBtn) : "none")
    );
    const pressed = menuBtn && menuBtn.pressed;
    if (pressed && !lastMenuButtonState) {
      vrDebugLog("VR Menu: menu button pressed");
      // Toggle menu
      if (menuVisible) hideMenu();
      else showMenu();
    }
    lastMenuButtonState = !!pressed;
    if (menuVisible && xrFrame) checkMenuInteraction(xrFrame);
  });

  // On-screen keyboard hint (desktop only)
  const uiHost = document.getElementById("ui") || document.body;
  let hintEl: HTMLDivElement | null = null;
  function createHint() {
    if (!showKeyboardHint) return null;
    const el = document.createElement("div");
    el.textContent = `Press ${keyboardToggleKey.toUpperCase()} to toggle menu`;
    el.style.position = "fixed";
    el.style.left = "12px";
    el.style.bottom = "12px";
    el.style.padding = "6px 10px";
    el.style.background = "rgba(0,0,0,0.5)";
    el.style.color = "white";
    el.style.borderRadius = "6px";
    el.style.fontFamily = "sans-serif";
    el.style.fontSize = "12px";
    el.style.zIndex = "9999";
    el.style.pointerEvents = "none";
    return el;
  }

  function updateHintVisibility() {
    if (!hintEl) return;
    const inXR = !!(renderer.xr.getSession && renderer.xr.getSession());
    // Show hint only when not in XR and menu is hidden
    hintEl.style.display = !inXR && !menuVisible ? "block" : "none";
  }

  if (showKeyboardHint) {
    hintEl = createHint();
    if (hintEl) uiHost.appendChild(hintEl);
  }

  // Keyboard shortcuts (desktop): toggle and hide
  function onKeyDown(e: KeyboardEvent) {
    if (disposed) return;
    // Ignore if focus is on a form control
    const tgt = e.target as HTMLElement | null;
    if (tgt && /(INPUT|TEXTAREA|SELECT)/i.test(tgt.tagName)) return;

    // If in XR session, ignore keyboard toggles
    if (renderer.xr.getSession && renderer.xr.getSession()) return;

    if (
      e.key === keyboardToggleKey ||
      e.key === keyboardToggleKey.toLowerCase() ||
      e.key === keyboardToggleKey.toUpperCase()
    ) {
      if (menuVisible) hideMenu();
      else showMenu();
      updateHintVisibility();
    } else if (e.key === keyboardHideKey) {
      if (menuVisible) hideMenu();
      updateHintVisibility();
    }
  }

  window.addEventListener("keydown", onKeyDown);

  // Return a dispose function so callers can remove the global listener and hint
  function dispose() {
    disposed = true;
    window.removeEventListener("keydown", onKeyDown);
    if (hintEl && hintEl.parentElement)
      hintEl.parentElement.removeChild(hintEl);
    hintEl = null;
  }

  // Optionally: return show/hide for manual control and dispose
  return { showMenu, hideMenu, dispose };
}
