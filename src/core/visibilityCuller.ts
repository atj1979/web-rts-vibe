import * as THREE from "three";

type CullEntry = {
  obj: THREE.Object3D;
  sphere: THREE.Sphere; // world-space bounding sphere used for intersection tests
  padding: number; // extra radius to pad the sphere
  recomputeEveryFrame: boolean; // if true, recompute bounds each frame (for dynamic objects)
};

const entries: CullEntry[] = [];

// Reusable temporaries to avoid allocations per-frame
const _box = new THREE.Box3();
const _projScreenMatrix = new THREE.Matrix4();
const _frustum = new THREE.Frustum();
const _viewMatrix = new THREE.Matrix4();

export type RegisterOptions = {
  /** If true, recompute bounding sphere every frame. Use for moving objects. Default false. */
  dynamic?: boolean;
  /** Extra radius padding to apply to the computed bounding sphere (meters). Default 0. */
  padding?: number;
  /** Optional explicit bounding sphere to use instead of computing from geometry. If provided, it's used as-is. */
  sphere?: THREE.Sphere;
};

/**
 * Register an object for frustum-based visibility culling.
 * Returns an unregister function (backwards compatible) which also has an
 * attached `updateBounds()` helper to manually refresh the computed bounds.
 *
 * Options:
 *  - dynamic: recompute bounding sphere every frame (useful for moving/animated objects)
 *  - padding: extra radius to add to sphere
 *  - sphere: explicit sphere to use (world-space)
 */
export function registerForCulling(
  obj: THREE.Object3D,
  opts?: RegisterOptions,
) {
  const padding = opts?.padding ?? 0;
  const recomputeEveryFrame = !!opts?.dynamic;

  const sphere = opts?.sphere ? opts.sphere.clone() : new THREE.Sphere();

  // Helper to (re)compute the world-space bounding sphere for this object
  function computeBounds() {
    // Ensure this object's world matrices are up-to-date before computing bounds
    obj.updateWorldMatrix(true, false);
    _box.setFromObject(obj);
    if (_box.isEmpty()) {
      // fallback: small sphere at object's world position
      const pos = new THREE.Vector3();
      obj.getWorldPosition(pos);
      sphere.center.copy(pos);
      sphere.radius = Math.max(1, obj.scale.length());
    } else {
      _box.getBoundingSphere(sphere);
    }
    if (padding) sphere.radius += padding;
  }

  // Initial compute unless explicit sphere was provided
  if (!opts?.sphere) computeBounds();

  const entry: CullEntry = { obj, sphere, padding, recomputeEveryFrame };
  entries.push(entry);

  // expose an updater for manual bound refresh
  const unregister = () => {
    const i = entries.indexOf(entry);
    if (i >= 0) entries.splice(i, 1);
  };

  // Attach an update helper onto the unregister function for backward-compatible extensibility
  (unregister as any).updateBounds = computeBounds;

  return unregister as unknown as (() => void) & { updateBounds?: () => void };
}

/**
 * Manually update bounds for a single registered object (if any).
 * Returns true if an entry was found and updated.
 */
export function updateBoundsFor(obj: THREE.Object3D) {
  for (const e of entries) {
    if (e.obj === obj) {
      obj.updateWorldMatrix(true, false);
      _box.setFromObject(obj);
      if (_box.isEmpty()) {
        const pos = new THREE.Vector3();
        obj.getWorldPosition(pos);
        e.sphere.center.copy(pos);
        e.sphere.radius = Math.max(1, obj.scale.length());
      } else {
        _box.getBoundingSphere(e.sphere);
      }
      if (e.padding) e.sphere.radius += e.padding;
      return true;
    }
  }
  return false;
}

/**
 * Update culling for the provided camera. Should be called once per frame
 * before rendering. This toggles object.visible for registered objects.
 */
export function updateCulling(camera: THREE.Camera) {
  if (entries.length === 0) return;

  // Ensure camera matrixWorld is up-to-date and build view matrix
  camera.updateWorldMatrix(true, false);
  _viewMatrix.copy(camera.matrixWorld).invert();
  // Build frustum from projection * view
  _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, _viewMatrix);
  _frustum.setFromProjectionMatrix(_projScreenMatrix);

  // Ensure top-level ancestors (typically the scene) have their matrixWorld updated
  const updatedRoots = new WeakSet<THREE.Object3D>();
  for (const e of entries) {
    let root: THREE.Object3D = e.obj;
    while (root.parent) root = root.parent;
    if (!updatedRoots.has(root)) {
      root.updateWorldMatrix(true, false);
      updatedRoots.add(root);
    }
  }

  for (const e of entries) {
    if (e.recomputeEveryFrame) {
      // Recompute bounds in-place for dynamic objects. Ensure transforms are current.
      e.obj.updateWorldMatrix(true, false);
      _box.setFromObject(e.obj);
      if (_box.isEmpty()) {
        const pos = new THREE.Vector3();
        e.obj.getWorldPosition(pos);
        e.sphere.center.copy(pos);
        e.sphere.radius = Math.max(1, e.obj.scale.length());
      } else {
        _box.getBoundingSphere(e.sphere);
      }
      if (e.padding) e.sphere.radius += e.padding;
    }

    const intersects = _frustum.intersectsSphere(e.sphere);
    e.obj.visible = intersects;
  }
}

// --- Auto-culling helpers -------------------------------------------------

type AutoOptions = {
  recursive: boolean;
  dynamic: boolean;
  padding: number;
  predicate?: (obj: THREE.Object3D) => boolean;
};

type AutoState = {
  options: AutoOptions;
  unregisters: WeakMap<THREE.Object3D, (() => void) | null>;
};

const watchedRoots: WeakMap<THREE.Object3D, AutoState> = new WeakMap();
let patchedAddRemove = false;
let origAdd: (
  this: THREE.Object3D,
  ...objects: THREE.Object3D[]
) => THREE.Object3D;
let origRemove: (
  this: THREE.Object3D,
  ...objects: THREE.Object3D[]
) => THREE.Object3D;

function shouldAutoRegister(
  obj: THREE.Object3D,
  predicate?: (o: THREE.Object3D) => boolean,
) {
  if (!predicate) {
    // default: register Mesh and InstancedMesh
    return (obj as any).isMesh || (obj as any).isInstancedMesh;
  }
  try {
    return predicate(obj);
  } catch (_) {
    return false;
  }
}

function ensurePatched() {
  if (patchedAddRemove) return;
  patchedAddRemove = true;
  origAdd = THREE.Object3D.prototype.add;
  origRemove = THREE.Object3D.prototype.remove as any;

  // patch add
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (THREE.Object3D.prototype as any).add = function (...objs: THREE.Object3D[]) {
    const res = origAdd.apply(this as any, objs as any);

    // For each added object, if its new parent is under a watched root, auto-register
    for (const o of objs) {
      // Walk upward from this to see if any watched root is an ancestor
      let p: THREE.Object3D | null = this as THREE.Object3D;
      while (p) {
        const state = watchedRoots.get(p);
        if (state) {
          // register the object (and subtree if recursive)
          autoRegisterNodeRecursive(o, state);
          break;
        }
        p = p.parent;
      }
    }

    return res;
  };

  // patch remove
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (THREE.Object3D.prototype as any).remove = function (
    ...objs: THREE.Object3D[]
  ) {
    const res = origRemove.apply(this as any, objs as any);

    for (const o of objs) {
      // For each removed object, walk up the former parent chain (this)
      let p: THREE.Object3D | null = this as THREE.Object3D;
      while (p) {
        const state = watchedRoots.get(p);
        if (state) {
          autoUnregisterNodeRecursive(o, state);
          break;
        }
        p = p.parent;
      }
    }

    return res;
  };
}

function autoRegisterNodeRecursive(root: THREE.Object3D, state: AutoState) {
  const stack: THREE.Object3D[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    if (
      !state.unregisters.has(node) &&
      shouldAutoRegister(node, state.options.predicate)
    ) {
      try {
        const u = registerForCulling(node, {
          dynamic: state.options.dynamic,
          padding: state.options.padding,
          sphere: undefined,
        });
        state.unregisters.set(node, u);
      } catch (err) {
        state.unregisters.set(node, null);
      }
    }
    if (state.options.recursive) {
      for (const c of node.children) stack.push(c);
    }
  }
}

function autoUnregisterNodeRecursive(root: THREE.Object3D, state: AutoState) {
  const stack: THREE.Object3D[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    const u = state.unregisters.get(node);
    if (u) {
      try {
        u();
      } catch (_) {}
      state.unregisters.delete(node);
    }
    if (state.options.recursive) {
      for (const c of node.children) stack.push(c);
    }
  }
}

/**
 * Enable automatic culling for all matching objects under the provided root.
 * This will register existing matching children immediately and watch for adds/removes
 * so newly added objects get registered automatically.
 *
 * Returns a disable function which will unregister everything and stop watching.
 */
export function enableAutoCulling(
  root: THREE.Object3D,
  opts?: {
    recursive?: boolean;
    dynamic?: boolean;
    padding?: number;
    predicate?: (obj: THREE.Object3D) => boolean;
  },
) {
  ensurePatched();
  const options: AutoOptions = {
    recursive: opts?.recursive ?? true,
    dynamic: opts?.dynamic ?? false,
    padding: opts?.padding ?? 0,
    predicate: opts?.predicate,
  };

  const state: AutoState = { options, unregisters: new WeakMap() };
  watchedRoots.set(root, state);

  // initial traversal
  autoRegisterNodeRecursive(root, state);

  return () => {
    // unregister all
    // WeakMap doesn't allow iteration, but we can walk the scene and call unregister where present
    const stack: THREE.Object3D[] = [root];
    while (stack.length) {
      const node = stack.pop()!;
      const u = state.unregisters.get(node);
      if (u) {
        try {
          u();
        } catch (_) {}
      }
      if (options.recursive) for (const c of node.children) stack.push(c);
    }
    watchedRoots.delete(root);
  };
}

/** Disable auto-culling for a root (alias to returned disable fn). */
export function disableAutoCulling(root: THREE.Object3D) {
  const s = watchedRoots.get(root);
  if (!s) return;
  // invoke returned disable to cleanup
  // We can't easily call the closure returned earlier here; instead walk and unregister
  const stack: THREE.Object3D[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    const u = s.unregisters.get(node);
    if (u) {
      try {
        u();
      } catch (_) {}
      s.unregisters.delete(node);
    }
    if (s.options.recursive) for (const c of node.children) stack.push(c);
  }
  watchedRoots.delete(root);
}
