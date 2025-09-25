import * as THREE from 'three';

/**
 * # Unified Ground Placement System
 *
 * This system provides a centralized, scene-agnostic way to place objects on the ground
 * across all scenes in the application. It automatically detects the ground type and
 * handles placement accordingly.
 *
 * ## Supported Ground Types:
 *
 * 1. **Flat Ground** (`type: 'flat'`): Simple horizontal plane at Y = defaultHeight (usually 0)
 *    - Used in: basicWorld.ts, tankDemo.ts (default)
 *    - Method: Direct Y-coordinate assignment
 *
 * 2. **Terrain Ground** (`type: 'terrain'`): Height-mapped terrain with hills/valleys
 *    - Used in: variedLandscape.ts
 *    - Method: Samples terrain geometry vertices to find height at X,Z position
 *    - Supports: Automatic terrain detection, UV coordinate mapping
 *
 * 3. **Raycast Ground** (`type: 'raycast'`): Physics-based ground detection
 *    - Not currently used but available for future complex scenes
 *    - Method: Raycasts downward from Y=1000 to find intersection with ground meshes
 *
 * ## Architecture:
 *
 * - **GroundPlacer**: Per-scene instance that handles placement logic
 * - **Global Instance**: Automatically updated when scenes change via SceneSwitcher
 * - **Auto-Detection**: Analyzes scene content to determine appropriate ground type
 * - **Bottom-Aligned**: Objects are placed so their bottom touches the ground surface
 * - **Extensible**: Easy to add new ground types or customize behavior
 *
 * ## Usage Examples:
 *
 * ```typescript
 * // Get the global ground placer (automatically configured for current scene)
 * const placer = getGlobalGroundPlacer(scene);
 *
 * // Place object at ground level for specific coordinates
 * placer.placeObject(myTree, 10, 20); // X=10, Z=20, Y=groundHeight
 *
 * // Place object using a position vector
 * const pos = new THREE.Vector3(5, 10, 15);
 * placer.placeObjectAt(myBuilding, pos); // Uses pos.x and pos.z, sets pos.y to groundHeight
 *
 * // Get ground height without placing object
 * const height = placer.getGroundHeight(10, 20);
 * ```
 *
 * ## Scene Integration:
 *
 * The system automatically integrates with the SceneSwitcher:
 * - Updates ground configuration when scenes change
 * - Detects terrain meshes, flat planes, etc.
 * - Maintains consistent placement behavior across all scenes
 *
 * ## Benefits:
 *
 * - **Consistency**: All objects use the same placement logic
 * - **Maintainability**: Single source of truth for ground placement
 * - **Extensibility**: Easy to add new ground types or modify behavior
 * - **Performance**: Efficient terrain sampling, no unnecessary raycasting
 * - **Scene-Agnostic**: Works with any scene configuration
 */

/**
 * Unified Ground Placement System
 *
 * This system provides a centralized way to place objects on the ground across all scenes.
 * It supports different ground types and automatically determines the appropriate placement
 * method based on the scene's ground configuration.
 *
 * Usage:
 *   const placer = createGroundPlacer(scene);
 *   placer.placeObject(myObject, x, z); // Places at (x, groundHeight, z) with bottom touching ground
 *   placer.placeObjectAt(myObject, new THREE.Vector3(x, y, z)); // Places at ground height for x,z with bottom touching ground
 */

export type GroundType = 'flat' | 'terrain' | 'raycast';

export interface GroundConfig {
  type: GroundType;
  /** For terrain type: the terrain mesh to sample heights from */
  terrainMesh?: THREE.Mesh;
  /** For raycast type: objects to raycast against */
  raycastTargets?: THREE.Object3D[];
  /** Default ground height for flat ground */
  defaultHeight?: number;
  /** Scene reference for raycasting */
  scene?: THREE.Scene;
}

export interface GroundPlacer {
  /** Place an object at the ground level for the given x,z coordinates */
  placeObject(object: THREE.Object3D, x: number, z: number): void;
  /** Place an object at ground level for the given position vector */
  placeObjectAt(object: THREE.Object3D, position: THREE.Vector3): void;
  /** Get the ground height at the given x,z coordinates */
  getGroundHeight(x: number, z: number): number;
  /** Update the ground configuration */
  updateConfig(config: Partial<GroundConfig>): void;
}

/**
 * Create a ground placer for the given scene configuration.
 * The placer automatically detects and configures based on scene content.
 */
export function createGroundPlacer(scene: THREE.Scene): GroundPlacer {
  // Auto-detect ground configuration from scene
  const config = detectGroundConfig(scene);

  let currentConfig = { ...config };

  const raycaster = new THREE.Raycaster();
  const downVector = new THREE.Vector3(0, -1, 0);

  function detectGroundConfig(scene: THREE.Scene): GroundConfig {
    // Look for terrain meshes (planes with displacement)
    const terrainMeshes = scene.children.filter(child =>
      child instanceof THREE.Mesh &&
      child.geometry instanceof THREE.PlaneGeometry &&
      child.rotation.x === -Math.PI / 2 // Horizontal plane
    ) as THREE.Mesh[];

    if (terrainMeshes.length > 0) {
      // Assume the largest terrain mesh is the main ground
      const terrainMesh = terrainMeshes.reduce((largest, current) =>
        current.geometry.attributes.position.count > largest.geometry.attributes.position.count
          ? current : largest
      );

      return {
        type: 'terrain',
        terrainMesh,
        defaultHeight: 0
      };
    }

    // Default to flat ground
    return {
      type: 'flat',
      defaultHeight: 0
    };
  }

  function getGroundHeight(x: number, z: number): number {
    switch (currentConfig.type) {
      case 'terrain':
        return getTerrainHeight(x, z);
      case 'raycast':
        return getRaycastHeight(x, z);
      case 'flat':
      default:
        return currentConfig.defaultHeight || 0;
    }
  }

  function getTerrainHeight(x: number, z: number): number {
    if (!currentConfig.terrainMesh) return 0;

    const terrain = currentConfig.terrainMesh;
    const geometry = terrain.geometry as THREE.PlaneGeometry;

    // Get terrain bounds (assuming centered at origin)
    const bbox = new THREE.Box3().setFromObject(terrain);

    // Convert world position to UV coordinates
    const u = (x - bbox.min.x) / (bbox.max.x - bbox.min.x);
    const v = (z - bbox.min.z) / (bbox.max.z - bbox.min.z);

    if (u < 0 || u > 1 || v < 0 || v > 1) {
      return currentConfig.defaultHeight || 0; // Outside terrain bounds
    }

    // Sample height from terrain geometry with bilinear interpolation for smooth terrain
    const verts = geometry.attributes.position;
    const segments = Math.sqrt(verts.count) - 1; // Assuming square grid

    // Get fractional position within grid cell
    const fx = u * segments;
    const fy = v * segments;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const dx = fx - ix;
    const dy = fy - iy;

    if (ix >= 0 && ix < segments && iy >= 0 && iy < segments) {
      // Get heights of the four surrounding vertices
      const idx00 = iy * (segments + 1) + ix;
      const idx10 = iy * (segments + 1) + (ix + 1);
      const idx01 = (iy + 1) * (segments + 1) + ix;
      const idx11 = (iy + 1) * (segments + 1) + (ix + 1);

      const h00 = verts.getZ(idx00);
      const h10 = verts.getZ(idx10);
      const h01 = verts.getZ(idx01);
      const h11 = verts.getZ(idx11);

      // Bilinear interpolation
      const h0 = h00 * (1 - dx) + h10 * dx;
      const h1 = h01 * (1 - dx) + h11 * dx;
      const height = h0 * (1 - dy) + h1 * dy;

      // Transform height to world space (terrain might be rotated/scaled)
      return height + terrain.position.y;
    }

    return currentConfig.defaultHeight || 0;
  }

  function getRaycastHeight(x: number, z: number): number {
    if (!currentConfig.raycastTargets || currentConfig.raycastTargets.length === 0) {
      return currentConfig.defaultHeight || 0;
    }

    raycaster.set(new THREE.Vector3(x, 1000, z), downVector);

    const intersects = raycaster.intersectObjects(currentConfig.raycastTargets, true);

    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return currentConfig.defaultHeight || 0;
  }

  function getObjectBottomOffset(object: THREE.Object3D): number {
    // Calculate how much to offset the object so its bottom touches the ground
    // instead of its center/origin

    object.updateMatrixWorld();

    // Special case: trees, tanks, grass, and flowers should have their bottom at y=0 (origin) touch the ground
    if (object.name && (object.name.includes('tree_') || object.name === 'tank' || object.name === 'grass' || object.name === 'flower')) {
      return 0;
    }

    // Check if this is a simple sphere geometry
    const meshes: THREE.Mesh[] = [];
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
        meshes.push(child);
      }
    });

    if (meshes.length === 1) {
      // For spheres, offset by the radius
      const sphereGeo = meshes[0].geometry as THREE.SphereGeometry;
      const radius = sphereGeo.parameters?.radius || 1;
      return radius;
    }

    // For other objects, calculate bounding box and offset by half height
    const bbox = new THREE.Box3().setFromObject(object);
    const height = bbox.max.y - bbox.min.y;
    return height / 2;
  }

  function placeObject(object: THREE.Object3D, x: number, z: number): void {
    const groundHeight = getGroundHeight(x, z);
    const bottomOffset = getObjectBottomOffset(object);
    object.position.set(x, groundHeight + bottomOffset, z);
  }

  function placeObjectAt(object: THREE.Object3D, position: THREE.Vector3): void {
    const groundHeight = getGroundHeight(position.x, position.z);
    const bottomOffset = getObjectBottomOffset(object);
    object.position.set(position.x, groundHeight + bottomOffset, position.z);
  }

  function updateConfig(newConfig: Partial<GroundConfig>): void {
    currentConfig = { ...currentConfig, ...newConfig };
  }

  return {
    placeObject,
    placeObjectAt,
    getGroundHeight,
    updateConfig
  };
}

/**
 * Global ground placer instance for the current scene.
 * Updated when scenes change via scene switcher.
 */
let globalGroundPlacer: GroundPlacer | null = null;

/**
 * Get or create the global ground placer for the current scene.
 * Always creates a fresh ground placer for the given scene.
 */
export function getGlobalGroundPlacer(scene: THREE.Scene): GroundPlacer {
  globalGroundPlacer = createGroundPlacer(scene);
  return globalGroundPlacer;
}

/**
 * Get the current global ground placer (must be initialized first).
 */
export function getCurrentGlobalGroundPlacer(): GroundPlacer | null {
  return globalGroundPlacer;
}
