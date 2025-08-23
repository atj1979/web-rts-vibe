


import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { createPerson } from './objects/person';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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

// Add a light source for the Phong material
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

camera.position.z = 5;



// Animation loop
function renderLoop() {
  person.rotation.y += 0.01;
  renderer.render(scene, camera);
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
