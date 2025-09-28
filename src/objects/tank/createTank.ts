import * as THREE from "three";
import { createNameSprite } from "../../core/nameSprite";

export interface TankParams {
  seed?: number;
  scale?: number;
  style?: "wornPaint" | "matte" | "heavyRust";
  color?: number | string | THREE.Color;
  wearIntensity?: number;
  dirtAmount?: number;
  detailScale?: number;
  mobileMode?: boolean;
  quality?: "high" | "low";
  debugMaterial?: boolean;
}

export type TankGroup = THREE.Group & {
  parts: {
    body: THREE.Mesh | null;
    turret: THREE.Group | null;
    barrel: THREE.Mesh | null;
    tracks: THREE.Mesh | null;
    wheels: THREE.Mesh[];
  };
  rotateTurret: (angleRad: number) => void;
  setBarrelElevation: (angleRad: number) => void;
  move: (distance: number, deltaTime?: number) => void;
  update: (deltaTime: number) => void;
  dispose: () => void;
};

const DEFAULTS: Required<TankParams> = {
  seed: 0,
  scale: 1,
  style: "wornPaint",
  color: 0x4f6b8a,
  wearIntensity: 0.4,
  dirtAmount: 0.3,
  detailScale: 1.0,
  mobileMode: false,
  quality: "high",
  debugMaterial: false,
};

function buildBodyGeom(scale = 1) {
  // Simple box body; subdivisions help smoothing and triplanar blending
  const geom = new THREE.BoxGeometry(
    2 * scale,
    0.8 * scale,
    4 * scale,
    3,
    2,
    5,
  );
  geom.computeVertexNormals();
  return geom;
}

function buildTurretGeom(scale = 1) {
  const geom = new THREE.BoxGeometry(
    1.6 * scale,
    0.5 * scale,
    1.8 * scale,
    2,
    2,
    3,
  );
  geom.translate(0, 0.25 * scale, 0);
  geom.computeVertexNormals();
  return geom;
}

function buildBarrelGeom(scale = 1) {
  const geom = new THREE.CylinderGeometry(
    0.08 * scale,
    0.12 * scale,
    2.2 * scale,
    12,
    1,
  );
  geom.translate(0, 0, 1.1 * scale);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

function buildWheelGeom(scale = 1) {
  const geom = new THREE.TorusGeometry(0.26 * scale, 0.08 * scale, 8, 16);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

function buildTrackStripGeom(scale = 1) {
  // A simple long plane that will be wrapped under the wheels in local space
  const geom = new THREE.PlaneGeometry(4.2 * scale, 0.6 * scale, 64, 8);
  geom.rotateX(-Math.PI / 2);
  // shift so strip centers under body
  geom.translate(0, -0.35 * scale, 0);
  geom.computeVertexNormals();
  return geom;
}

function hexToVec3(hex: number | string | THREE.Color) {
  const c = new THREE.Color(hex as any);
  return new THREE.Vector3(c.r, c.g, c.b);
}

const VERT_SHADER = `
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

// Simple classic noise + fbm adapted from common GLSL snippets
const FRAG_SHADER = `
precision highp float;
uniform float time;
uniform vec3 albedo;
uniform float wearIntensity;
uniform float dirtAmount;
uniform float detailScale;
uniform float metalnessBase;
uniform float roughnessBase;
uniform vec3 lightDir;
uniform float trackOffset; // for track shader use
varying vec3 vWorldPos;
varying vec3 vNormal;

// Hash / noise
float hash(vec2 p) { p = 50.0 * fract(p * 0.3183099 + vec2(0.71,0.113)); return fract(p.x * p.y * 95.4307); }
float noise(in vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f); return mix(mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y); }
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5; vec2 shift = vec2(100.0,100.0);
  for (int i=0;i<5;i++){
    v += a * noise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

// triplanar sample of procedural noise
float triNoise(vec3 p) {
  vec3 ab = p.yz * detailScale;
  vec3 bc = p.zx * detailScale;
  vec3 ca = p.xy * detailScale;
  float xa = fbm(ab);
  float xb = fbm(bc);
  float xc = fbm(ca);
  vec3 n = abs(normalize(vNormal));
  float blend = (n.x + n.y + n.z);
  return (xa * n.x + xb * n.y + xc * n.z) / max(blend, 0.0001);
}

void main() {
  // base procedural masks
  float n = triNoise(vWorldPos * 0.5);
  float wear = smoothstep(0.45, 0.8, n + wearIntensity * 0.5);
  float dirt = smoothstep(0.2, 0.6, n * (1.0 + dirtAmount));

  vec3 base = albedo;
  // exposed metal where wear is high
  vec3 metalColor = vec3(0.45,0.35,0.25);
  vec3 color = mix(base, metalColor, wear * 0.9);

  float metal = metalnessBase * wear;
  float rough = roughnessBase + (dirt * 0.3);

  // simple lighting: lambert + blinn spec
  vec3 N = normalize(vNormal);
  vec3 L = normalize(lightDir);
  vec3 V = normalize(-vWorldPos); // approximate view vector
  float NdotL = max(dot(N, L), 0.0);
  vec3 diffuse = color * NdotL;

  // Blinn-Phong specular; roughness maps to shininess
  vec3 H = normalize(L + V);
  float NdotH = max(dot(N, H), 0.0);
  float shininess = mix(8.0, 2.0, rough); // lower rough => higher shininess
  float spec = pow(NdotH, shininess) * (1.0 - metal);
  vec3 specular = vec3(0.04) * spec + metal * 0.6 * pow(NdotH, 6.0);

  vec3 outColor = diffuse + specular;
  outColor = pow(outColor, vec3(1.0/2.2));

  gl_FragColor = vec4(outColor, 1.0);
}
`;

function createTankMaterial(params: TankParams) {
  const p = { ...DEFAULTS, ...(params || {}) };
  const albedoVec = hexToVec3(p.color);
  const uniforms: Record<string, any> = {
    time: { value: 0 },
    albedo: { value: albedoVec },
    wearIntensity: { value: p.wearIntensity },
    dirtAmount: { value: p.dirtAmount },
    detailScale: { value: p.detailScale },
    metalnessBase: { value: 0.8 },
    roughnessBase: { value: 0.6 },
    lightDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
    trackOffset: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT_SHADER,
    fragmentShader: FRAG_SHADER,
    side: THREE.FrontSide,
  });
  return mat;
}

export function createTank(params: TankParams = {}): TankGroup {
  const p = { ...DEFAULTS, ...(params || {}) };
  const root = new THREE.Group() as TankGroup;
  root.scale.setScalar(p.scale);
  root.name = `tank`;
  // attach identification sprite
  const sprite = createNameSprite("Tank", Math.floor(Math.random() * 10000));
  sprite.position.set(0, 1.6 * p.scale, 0);
  root.add(sprite);

  // Allow a debug fallback material for easier visual debugging of placement/geometry
  const sharedMat = p.debugMaterial
    ? new THREE.MeshStandardMaterial({ color: p.color })
    : createTankMaterial(p);

  // Build parts
  const body = new THREE.Mesh(buildBodyGeom(p.scale), sharedMat);
  // lift the body so bottom sits on y=0 (floor)
  body.position.y = 0.4 * p.scale;
  body.castShadow = true;
  body.receiveShadow = true;

  const turret = new THREE.Group();
  const turretMesh = new THREE.Mesh(buildTurretGeom(p.scale), sharedMat);
  turret.add(turretMesh);
  turret.position.set(0, 0.4 * p.scale, 0);

  const barrel = new THREE.Mesh(buildBarrelGeom(p.scale), sharedMat);
  barrel.position.set(0, 0.05 * p.scale, 0.9 * p.scale);
  barrel.castShadow = true;
  turret.add(barrel);

  // wheels
  const wheels: THREE.Mesh[] = [];
  const wheelGeom = buildWheelGeom(p.scale);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const wheelPositions = [-1.1, -0.5, 0.1, 0.7, 1.3];
  wheelPositions.forEach((x) => {
    const left = new THREE.Mesh(wheelGeom, wheelMat);
    left.position.set(-1.05 * p.scale, -0.25 * p.scale, x * p.scale);
    left.castShadow = true;
    body.add(left);
    wheels.push(left);
    const right = new THREE.Mesh(wheelGeom, wheelMat);
    right.position.set(1.05 * p.scale, -0.25 * p.scale, x * p.scale);
    right.castShadow = true;
    body.add(right);
    wheels.push(right);
  });

  // tracks
  const track = new THREE.Mesh(buildTrackStripGeom(p.scale), sharedMat);
  track.position.set(0, 0, 0);
  track.castShadow = false;
  track.receiveShadow = true;

  // Assemble
  root.add(body);
  body.add(turret);
  body.add(track);

  root.parts = {
    body,
    turret,
    barrel,
    tracks: track,
    wheels,
  };

  // state
  let turretAngle = 0;
  let barrelAngle = 0;
  let traveled = 0;
  let velocity = 0;

  function rotateTurret(angleRad: number) {
    turretAngle = angleRad;
    turret.rotation.y = turretAngle;
  }

  function setBarrelElevation(angleRad: number) {
    barrelAngle = THREE.MathUtils.clamp(angleRad, -Math.PI / 6, Math.PI / 12);
    barrel.rotation.x = barrelAngle;
  }

  function move(distance: number, deltaTime = 0.016) {
    // move along local -Z forward
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      root.quaternion,
    );
    root.position.addScaledVector(forward, distance);
    traveled += Math.abs(distance);
    velocity = distance / Math.max(deltaTime, 1e-6);
    // rotate wheels
    const wheelRadius = 0.26 * p.scale;
    const wheelAngle = distance / wheelRadius;
    wheels.forEach((w) => {
      w.rotation.x += wheelAngle;
    });
    // update track offset (guard for debug/material fallback)
    if ((sharedMat as any).uniforms) {
      ((sharedMat as any).uniforms.trackOffset.value as number) =
        traveled * 0.5;
    }
  }

  function update(deltaTime: number) {
    if ((sharedMat as any).uniforms) {
      (sharedMat as any).uniforms.time.value += deltaTime;
    }
    // if moving, animate subtle wheel rotation based on velocity
    if (Math.abs(velocity) > 1e-4) {
      const wheelRadius = 0.26 * p.scale;
      const wheelAngle = (velocity * deltaTime) / wheelRadius;
      wheels.forEach((w) => {
        w.rotation.x += wheelAngle;
      });
      traveled += Math.abs(velocity * deltaTime);
      if ((sharedMat as any).uniforms) {
        ((sharedMat as any).uniforms.trackOffset.value as number) =
          traveled * 0.5;
      }
      // damp velocity slightly
      velocity *= 0.98;
    }
    // keep turret and barrel transforms in sync
    turret.rotation.y = turretAngle;
    barrel.rotation.x = barrelAngle;
  }

  function dispose() {
    // dispose geometries and materials created here
    body.geometry.dispose();
    turretMesh.geometry.dispose();
    barrel.geometry.dispose();
    wheelGeom.dispose();
    track.geometry.dispose();
    sharedMat.dispose();
    wheelMat.dispose();
  }

  root.rotateTurret = rotateTurret;
  root.setBarrelElevation = setBarrelElevation;
  root.move = move;
  root.update = update;
  root.dispose = dispose;

  return root;
}

export default createTank;
