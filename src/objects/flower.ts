import * as THREE from 'three'
import { createNameSprite } from '../core/nameSprite'

type FlowerColor = 'yellow' | 'blue' | 'pink' | 'purple' | 'white'
type PetalShape = 'round' | 'pointed' | 'wide'

/**
 * Designer_3d style: procedural flowering plant using basic Three.js shapes.
 * Supports color variants and petal shapes.
 *
 * Usage:
 *   const flower = createFlower({ color: 'pink', petalShape: 'round', petalSize: 0.15, petalCount: 5 })
 *   scene.add(flower)
 */
export function createFlower(params = {}) {
  const flowerColors: FlowerColor[] = ['yellow', 'blue', 'pink', 'purple', 'white'];
  const petalShapes: PetalShape[] = ['round', 'pointed', 'wide'];

  const opts = Object.assign({
    color: flowerColors[Math.floor(Math.random() * flowerColors.length)] as FlowerColor,
    petalShape: petalShapes[Math.floor(Math.random() * petalShapes.length)] as PetalShape,
    petalSize: 0.1 + Math.random() * 0.1, // 0.1 to 0.2
    petalCount: 4 + Math.floor(Math.random() * 4), // 4 to 8
    stemHeight: 0.5 + Math.random() * 0.5, // 0.5 to 1.0
    windStrength: 0.2 + Math.random() * 0.3, // 0.2 to 0.5
    mobileMode: false,
  }, params)

  const group = new THREE.Group()
  group.name = 'flower'

  // Color mapping
  const colorMap: Record<FlowerColor, number> = {
    yellow: 0xFFFF00,
    blue: 0x0000FF,
    pink: 0xFFC0CB,
    purple: 0x800080,
    white: 0xFFFFFF,
  }
  const petalColor = colorMap[opts.color]

  // Stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * opts.petalSize, 0.03 * opts.petalSize, opts.stemHeight * opts.petalSize, 8),
    new THREE.MeshStandardMaterial({ color: 0x228B22 }) // green
  )
  stem.position.y = (opts.stemHeight * opts.petalSize) / 2
  group.add(stem)

  // Petals
  const petalRadius = opts.petalSize
  const petalHeight = 0.05 * opts.petalSize
  for (let i = 0; i < opts.petalCount; i++) {
    let petalGeo
    if (opts.petalShape === 'round') {
      petalGeo = new THREE.SphereGeometry(petalRadius, 8, 6)
    } else if (opts.petalShape === 'pointed') {
      petalGeo = new THREE.ConeGeometry(petalRadius, petalHeight * 2, 8)
    } else if (opts.petalShape === 'wide') {
      petalGeo = new THREE.CylinderGeometry(petalRadius, petalRadius * 0.8, petalHeight, 8)
    } else {
      petalGeo = new THREE.SphereGeometry(petalRadius, 8, 6) // default
    }

    const petal = new THREE.Mesh(
      petalGeo,
      new THREE.MeshStandardMaterial({ color: petalColor })
    )
    const angle = (i / opts.petalCount) * Math.PI * 2
    petal.position.set(
      Math.cos(angle) * petalRadius * 1.5,
      opts.stemHeight * opts.petalSize + petalHeight / 2,
      Math.sin(angle) * petalRadius * 1.5
    )
    petal.rotation.z = angle + Math.PI / 2
    group.add(petal)
  }

  // Center (pistil/stamen)
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.05 * opts.petalSize, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xFFFF99 }) // yellowish
  )
  center.position.y = opts.stemHeight * opts.petalSize
  group.add(center)

  // Add identification sprite
  const sprite = createNameSprite('Flower', Math.floor(Math.random() * 10000))
  sprite.position.set(0, opts.stemHeight * opts.petalSize + opts.petalSize * 0.5, 0)
  group.add(sprite)

  // Wind animation
  const updateFn = () => {
    const now = performance.now() * 0.001
    const wind = opts.windStrength
    group.children.forEach((child) => {
      if (child === sprite) return
      child.rotation.x = Math.sin(now * 1.5) * wind * 0.1
    })
  }

  // Register update
  if (typeof window !== 'undefined' && (window as any).updateManager) {
    (window as any).updateManager.register(updateFn)
  }

  return group
}
