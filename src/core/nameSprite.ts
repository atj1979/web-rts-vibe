import * as THREE from 'three'

// Manager for object name sprites. Creates a sprite with a canvas texture and
// keeps a registry so visibility can be toggled via the 't' key.

const sprites: THREE.Sprite[] = []
let visible = true
let inited = false

function makeCanvasText(name: string, id: number) {
  const w = 512
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  // background (semi-transparent dark)
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, w, h)
  // text
  ctx.fillStyle = '#ffffff'
  ctx.font = '36px monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${name} #${id}`, 16, h / 2)
  return canvas
}

function createNameSprite(name: string, id: number) {
  if (!inited && typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T') toggleVisibility()
    })
    inited = true
  }

  const canvas = makeCanvasText(name, id)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false })
  const sprite = new THREE.Sprite(mat)
  // ensure always on top
  sprite.renderOrder = 10000
  sprite.scale.set(1.5, 0.4, 1)
  sprite.visible = visible
  sprites.push(sprite)
  return sprite
}

function setVisibility(v: boolean) {
  visible = v
  for (const s of sprites) s.visible = v
}

function toggleVisibility() {
  setVisibility(!visible)
}

export { createNameSprite, setVisibility, toggleVisibility }
