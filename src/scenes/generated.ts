import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getGlobalGroundPlacer } from '../core/groundPlacement';

// Import GLB files as URLs so Vite serves them correctly
import modelAUrl from '../objects/generated/BuildingGeneral.glb?url';
import modelBUrl from '../objects/generated/DroneHelicopter.glb?url';
import modelCUrl from '../objects/generated/TurretMachineGun.glb?url';

const FILE_URLS = [modelAUrl, modelBUrl, modelCUrl];

export function addGenerated(scene: THREE.Scene) {
  const objects: THREE.Object3D[] = [];
  const loader = new GLTFLoader();

  // --- Ground (grass-like plane) ---
  // Add a large horizontal PlaneGeometry so the GroundPlacer auto-detects a flat ground.
  const groundSize = 200;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 1, 1);

  // Create a simple procedural canvas texture to give a grassy look without external assets
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const baseColor = '#4caf50';
  const darkColor = '#387e3b';
  const lightColor = '#66bb6a';
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, lightColor);
  g.addColorStop(1, baseColor);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // draw subtle grass blades/strokes
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.7 ? darkColor : 'rgba(0,0,0,0.03)';
    ctx.fillRect(x, y, 1, Math.random() * 8 + 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(groundSize / 10, groundSize / 10);

  const groundMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2; // horizontal plane
  groundMesh.receiveShadow = true;
  groundMesh.name = 'ground_plane';
  scene.add(groundMesh);
  objects.push(groundMesh);

  const groundPlacer = getGlobalGroundPlacer(scene);

  // --- Skybox (gradient sphere) ---
  const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true, fog: false });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  const colorTop = new THREE.Color(0x87ceeb);
  const colorHorizon = new THREE.Color(0xffffff);
  const pos = skyGeo.attributes.position;
  const skyColors: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 1000;
    const c = colorTop.clone().lerp(colorHorizon, (y + 1) / 2);
    skyColors.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
  scene.add(skyMesh);
  objects.push(skyMesh);

  // --- Lighting ---
  // const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  // dir.position.set(5, 10, 7);
  // scene.add(dir);
  // objects.push(dir);

  // const amb = new THREE.AmbientLight(0xffffff, 0.35);
  // scene.add(amb);
  // objects.push(amb);

  // Add a warm point light to give models nicer specular/highlight
  const point = new THREE.PointLight(0xfff0d6, 999.2, 30, 2);
  point.position.set(0, 5, 6);
  scene.add(point);
  objects.push(point);

  // Load each model (using URLs from Vite) and place them in a row
  const spacing = 4;
  FILE_URLS.forEach((url, idx) => {
    loader.load(
      url,
      (gltf: any) => {
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) return;
        root.name = `generated_${idx}`;
        // scale models up to be more visible
        root.scale.setScalar(3);
        // Place spread out on x axis
        const x = (idx - (FILE_URLS.length - 1) / 2) * spacing;
        groundPlacer.placeObject(root, x, 0);
        root.rotation.y = Math.random() * Math.PI * 2;
        scene.add(root);
        objects.push(root);
      },
      undefined,
      (err: unknown) => {
        console.warn('Failed to load generated model', url, err);
      }
    );
  });

  return {
    dispose() {
      for (const o of objects) {
        scene.remove(o);
        (o as any).traverse?.((child: any) => {
          if (child.geometry) child.geometry.dispose?.();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose?.());
            } else {
              child.material.dispose?.();
            }
          }
        });
      }
    },
    getSpawnPosition() {
      // Spawn a bit behind center
      return new THREE.Vector3(0, 1.2, 3);
    },
  };
}
