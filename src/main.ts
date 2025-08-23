
import * as THREE from 'three';
import { createPerson } from './objects/person';

// Create scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Add a simple person
const person = createPerson();
scene.add(person);

// Add a light source for the Phong material
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

camera.position.z = 5;


// Animation loop
function animate() {
  requestAnimationFrame(animate);
  person.rotation.y += 0.01;
  renderer.render(scene, camera);
}

animate();
