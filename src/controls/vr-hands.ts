import * as THREE from 'three';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

/**
 * Setup hand tracking with controller fallback.
 * - Returns an object with left/right hand groups and controllers.
 */
export function setupVRHands(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const handFactory = new XRHandModelFactory();
  const controllerFactory = new XRControllerModelFactory();

  const hands = {
    left: null as unknown as THREE.Group,
    right: null as unknown as THREE.Group,
    controllerLeft: null as unknown as THREE.Group,
    controllerRight: null as unknown as THREE.Group,
  };

  // controllers
  const controller1 = renderer.xr.getController(0);
  const controller2 = renderer.xr.getController(1);
  scene.add(controller1);
  scene.add(controller2);

  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  const controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  // hands
  const hand1 = renderer.xr.getHand(0);
  const hand2 = renderer.xr.getHand(1);
  hand1.add(handFactory.createHandModel(hand1));
  hand2.add(handFactory.createHandModel(hand2));
  scene.add(hand1);
  scene.add(hand2);

  hands.left = hand1;
  hands.right = hand2;
  hands.controllerLeft = controllerGrip1;
  hands.controllerRight = controllerGrip2;

  // Update function: toggle visibility based on whether the XR session reports hand input sources
  function update() {
    const session = renderer.xr.getSession();
    if (!session) {
      // not in XR session: hide hands/controllers or keep controllers visible for entering VR
      hand1.visible = false;
      hand2.visible = false;
      controllerGrip1.visible = true;
      controllerGrip2.visible = true;
      return;
    }

    const inputSources = Array.from(session.inputSources || []);
    const leftHanded = inputSources.some((s: any) => s.handedness === 'left' && !!s.hand);
    const rightHanded = inputSources.some((s: any) => s.handedness === 'right' && !!s.hand);

    // If hand tracking is available for a hand, show the hand model and hide the controller model
    hand1.visible = leftHanded;
    hand2.visible = rightHanded;
    controllerGrip1.visible = !leftHanded;
    controllerGrip2.visible = !rightHanded;
  }

  // Listen for session start/end and input source changes to update visibility
  renderer.xr.addEventListener('sessionstart', update as any);
  renderer.xr.addEventListener('sessionend', update as any);

  // return hands + updater
  return { ...hands, update };
}
