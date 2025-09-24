import * as THREE from 'three'
import { createNameSprite } from '../core/nameSprite'

/**
 * Designer_3d style: procedural grass patch using basic Three.js shapes.
 * Creates a group of cylindrical blades with variance in position and color.
 * Includes wind animation and a name sprite.
 *
 * Usage:
 *   const grass = createGrass({ color: 0x32CD32, size: 1.5, fill: 20, windStrength: 0.8 })
 *   scene.add(grass)
 */
export function createGrass(params = {}) {
  const opts = Object.assign({
    color: 0x228B22, // default green
    size: 1.0, // height of blades
    fill: 15, // number of blades
    windStrength: 0.5, // animation intensity
    bladeWidth: 0.005, // base width of blades
    mobileMode: false,
  }, params)

  const group = new THREE.Group()
  group.name = 'grass'

  // Add identification sprite
  const sprite = createNameSprite('Grass', Math.floor(Math.random() * 10000))
  sprite.position.set(0, opts.size * 1.5, 0)
  group.add(sprite)

  // Create blades: thin cylinders for grass blades
  for (let i = 0; i < opts.fill; i++) {
    const bladeHeight = opts.size * (0.8 + Math.random() * 0.4) // vary height
    const blade = new THREE.Mesh(
      new THREE.CylinderGeometry(opts.bladeWidth, opts.bladeWidth * 2, bladeHeight, 6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(opts.color).offsetHSL(Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05) // slight color variance
      })
    )
    // Random position within a small area
    blade.position.set(
      (Math.random() - 0.5) * opts.size * 0.5,
      bladeHeight / 2,
      (Math.random() - 0.5) * opts.size * 0.5
    )
    // Slight random tilt
    blade.rotation.z = (Math.random() - 0.5) * 0.3
    blade.rotation.x = (Math.random() - 0.5) * 0.1
    group.add(blade)
  }

  // Wind animation: register per-frame update
  const updateFn = () => {
    const now = performance.now() * 0.001
    const windSpeed = opts.windStrength
    group.children.forEach((child, index) => {
      if (child === sprite) return
      const blade = child as THREE.Mesh
      // Simple sine wave for wind sway
      blade.rotation.x = Math.sin(now * 2 + index * 0.5) * windSpeed * 0.2 + blade.rotation.x * 0.9 // blend with initial
    })
  }

  // Register with updateManager if available
  if (typeof window !== 'undefined' && (window as any).updateManager) {
    (window as any).updateManager.register(updateFn)
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).updateManager) {
    (globalThis as any).updateManager.register(updateFn)
  }

  return group
}
