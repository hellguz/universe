import * as THREE from 'three'
import reductionVertexShader from '../shaders/reduction/vertex.glsl'
import reductionFragmentShader from '../shaders/reduction/particleCountFragment.glsl'

/**
 * GPU-based particle counting using parallel reduction
 * Reduces 1M particles down to 3 counts (dark matter, gas, stars) on GPU
 * Much faster than CPU readback + loop
 */

export interface ReductionChain {
  renderTargets: THREE.WebGLRenderTarget[]
  materials: THREE.ShaderMaterial[]
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
}

/**
 * Create render targets for reduction chain
 * Reduces from inputSize down to 1x1 in multiple passes
 */
export function createReductionRenderTargets(inputSize: number): THREE.WebGLRenderTarget[] {
  const targets: THREE.WebGLRenderTarget[] = []

  const rtOptions = {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    stencilBuffer: false,
    depthBuffer: false
  }

  // Calculate reduction chain sizes (each pass reduces by 4x)
  let currentSize = inputSize
  while (currentSize > 1) {
    currentSize = Math.ceil(currentSize / 4)
    const rt = new THREE.WebGLRenderTarget(currentSize, currentSize, rtOptions)
    targets.push(rt)
  }

  return targets
}

/**
 * Create material for reduction pass
 */
export function createReductionMaterial(
  inputTexture: THREE.Texture,
  inputSize: number,
  isFirstPass: boolean
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      inputTexture: { value: inputTexture },
      inputSize: { value: inputSize },
      isFirstPass: { value: isFirstPass ? 1.0 : 0.0 } // Convert bool to float
    },
    vertexShader: reductionVertexShader,
    fragmentShader: reductionFragmentShader
  })
}

/**
 * Create complete reduction chain for particle counting
 */
export function createReductionChain(inputSize: number): ReductionChain {
  const renderTargets = createReductionRenderTargets(inputSize)
  const materials: THREE.ShaderMaterial[] = []

  // Create materials for each reduction pass
  let currentInputSize = inputSize
  for (let i = 0; i < renderTargets.length; i++) {
    const isFirstPass = i === 0
    const material = createReductionMaterial(
      renderTargets[0].texture, // Will be updated at runtime
      currentInputSize,
      isFirstPass
    )
    materials.push(material)
    currentInputSize = Math.ceil(currentInputSize / 4)
  }

  // Create scene and camera for reduction passes
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geometry = new THREE.PlaneGeometry(2, 2)
  const mesh = new THREE.Mesh(geometry, materials[0])
  scene.add(mesh)

  return {
    renderTargets,
    materials,
    scene,
    camera
  }
}

/**
 * Run reduction chain to count particles
 * Returns counts [darkMatter, gas, stars]
 */
export function runReductionChain(
  gl: THREE.WebGLRenderer,
  chain: ReductionChain,
  inputTexture: THREE.Texture,
  inputSize: number
): [number, number, number] {
  const mesh = chain.scene.children[0] as THREE.Mesh

  // Run reduction passes
  let currentInputTexture = inputTexture
  let currentInputSize = inputSize

  for (let i = 0; i < chain.renderTargets.length; i++) {
    const material = chain.materials[i]
    const target = chain.renderTargets[i]

    // Update material uniforms
    material.uniforms.inputTexture.value = currentInputTexture
    material.uniforms.inputSize.value = currentInputSize

    // Render reduction pass
    mesh.material = material
    gl.setRenderTarget(target)
    gl.render(chain.scene, chain.camera)

    // Next pass reads from this pass's output
    currentInputTexture = target.texture
    currentInputSize = Math.ceil(currentInputSize / 4)
  }

  // Read final 1x1 result
  const finalTarget = chain.renderTargets[chain.renderTargets.length - 1]
  const buffer = new Float32Array(4) // Only 4 floats!
  gl.setRenderTarget(finalTarget)
  gl.readRenderTargetPixels(finalTarget, 0, 0, 1, 1, buffer)
  gl.setRenderTarget(null)

  return [
    Math.round(buffer[0]), // Dark matter count
    Math.round(buffer[1]), // Gas count
    Math.round(buffer[2])  // Star count
  ]
}
