import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { getGlobalGroundPlacer } from "../core/groundPlacement";

// Import GLB files as URLs so Vite serves them correctly
import modelAUrl from "../objects/generated/BuildingGeneral.glb?url";
import modelBUrl from "../objects/generated/DroneHelicopter.glb?url";
import modelCUrl from "../objects/generated/TurretMachineGun.glb?url";
import modelDUrl from "../objects/generated/BasicTowerBottom.glb?url";
import modelEUrl from "../objects/generated/Crystal1.glb?url";
import modelFUrl from "../objects/generated/LaserStationary.glb?url";

const FILE_URLS = [
  modelAUrl,
  modelBUrl,
  modelCUrl,
  modelDUrl,
  modelEUrl,
  modelFUrl,
];

export function addGenerated(scene: THREE.Scene) {
  // Root group to own all generated scene content (except ground which remains a scene child
  // so ground auto-detection in GroundPlacer continues to work).
  const container = new THREE.Group();
  container.name = "generated_root";
  scene.add(container);
  const loader = new GLTFLoader();

  // --- Ground (grass-like plane) ---
  // Add a large horizontal PlaneGeometry so the GroundPlacer auto-detects a flat ground.
  const groundSize = 200;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 1, 1);

  // Create a simple procedural canvas texture to give a grassy look without external assets
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const baseColor = "#4caf50";
  const darkColor = "#387e3b";
  const lightColor = "#66bb6a";
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, lightColor);
  g.addColorStop(1, baseColor);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // draw subtle grass blades/strokes
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.7 ? darkColor : "rgba(0,0,0,0.03)";
    ctx.fillRect(x, y, 1, Math.random() * 8 + 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(groundSize / 10, groundSize / 10);

  const groundMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 1,
    metalness: 0,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2; // horizontal plane
  groundMesh.receiveShadow = true;
  groundMesh.name = "ground_plane";
  scene.add(groundMesh);

  const groundPlacer = getGlobalGroundPlacer(scene);

  // --- Skybox (gradient sphere) ---
  const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
  const skyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: true,
    fog: false,
  });
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
  skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(skyColors, 3));
  // Add visual content into the container group so it can be removed/ disposed as one unit.
  container.add(skyMesh);

  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  container.add(amb);

  // Add a directional light to simulate sunlight
  const sun = new THREE.DirectionalLight(0xffffff, 6.8);
  sun.position.set(100, 200, 100);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 500;
  container.add(sun);

  // Load each model (using URLs from Vite) and place them in a row
  const spacing = 4;
  FILE_URLS.forEach((url, idx) => {
    loader.load(
      url,
      (gltf: any) => {
        const gltfRoot = gltf.scene || gltf.scenes?.[0];
        if (!gltfRoot) return;
        gltfRoot.name = `generated_${idx}`;
        // scale models up to be more visible
        gltfRoot.scale.setScalar(3);
        // Place spread out on x axis
        const x = (idx - (FILE_URLS.length - 1) / 2) * spacing;
        groundPlacer.placeObject(gltfRoot, x, 0);
        gltfRoot.rotation.y = Math.random() * Math.PI * 2;
        container.add(gltfRoot);
      },
      undefined,
      (err: unknown) => {
        console.warn("Failed to load generated model", url, err);
      },
    );
  });

  return {
    dispose() {
      // Remove and dispose all generated content in the container
      scene.remove(container);
      container.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose?.();
        if (child.material) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const m of mats) {
            if (m.map) m.map.dispose?.();
            m.dispose?.();
          }
        }
      });

      // Remove and dispose the ground mesh (it was added directly to the scene)
      scene.remove(groundMesh);
      if (groundMesh.geometry) groundMesh.geometry.dispose?.();
      if (groundMesh.material) {
        const gm = groundMesh.material as any;
        if (gm.map) gm.map.dispose?.();
        gm.dispose?.();
      }
      // Also dispose canvas texture reference if still present
      if ((texture as any)?.dispose) (texture as any).dispose();
    },
    getSpawnPosition() {
      // Spawn a bit behind center
      return new THREE.Vector3(0, 1.2, 3);
    },
  };
}
