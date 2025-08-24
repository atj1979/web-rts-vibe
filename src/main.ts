


import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { createPerson } from './objects/person';
import { setupVRHands } from './controls/vr-hands';
import { COMMIT } from './commit';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const userCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Add VR button if available
if ('xr' in navigator) {
  document.body.appendChild(VRButton.createButton(renderer));
} else {
  // Fallback: show a message or just use standard controls
  const fallbackMsg = document.createElement('div');
  fallbackMsg.innerText = 'VR not supported. Using standard controls.';
  fallbackMsg.style.position = 'absolute';
  fallbackMsg.style.top = '10px';
  fallbackMsg.style.left = '10px';
  fallbackMsg.style.background = 'rgba(0,0,0,0.7)';
  fallbackMsg.style.color = 'white';
  fallbackMsg.style.padding = '8px 16px';
  fallbackMsg.style.borderRadius = '8px';
  document.body.appendChild(fallbackMsg);
}


// Add a simple person
const person = createPerson();
scene.add(person);

// Setup VR hands and controller models (hand-tracking with controller fallback)
const vrHands = setupVRHands(renderer, scene);

// Log commit hash so deployed builds can be traced
console.log('Build commit:', COMMIT);

// Add a light source for the Phong material
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);


// Position the userCamera a short distance in front of and above the person, looking at the person's center
userCamera.position.set(0, 2, 7);
userCamera.lookAt(0, 1, 0);



// Animation loop
function renderLoop() {
  person.rotation.y += 0.01;
  // update VR hands visibility/logic if available
  if ((vrHands as any)?.update) {
    (vrHands as any).update();
  }
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
