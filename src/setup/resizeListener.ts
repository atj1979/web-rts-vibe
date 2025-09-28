import * as THREE from "three";

/**
 * Sets up a resize listener for the renderer and camera.
 * @param opts.renderer - The THREE.WebGLRenderer instance
 * @param opts.camera - The THREE.PerspectiveCamera (or similar)
 * @param opts.parentEl - (Optional) The parent element to size to (defaults to window)
 * @returns { dispose } - Call dispose() to remove the event listener
 */
export function setupResizeListener({
  renderer,
  camera,
  parentEl,
}: {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  parentEl?: HTMLElement | null;
}) {
  function resizeRendererToDisplaySize() {
    const width = parentEl?.clientWidth || window.innerWidth;
    const height = parentEl?.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resizeRendererToDisplaySize();
  window.addEventListener("resize", resizeRendererToDisplaySize);
  return {
    dispose() {
      window.removeEventListener("resize", resizeRendererToDisplaySize);
    },
  };
}
