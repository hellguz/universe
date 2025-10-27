import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../store/simulationStore'
import {
  createPositionTexture,
  createVelocityTexture,
  createParticleUVs
} from '../utils/dataTexture'
import { createVelocityMaterial, createPositionMaterial } from '../simulation/SimulationMaterial'
import { createRenderMaterial } from '../simulation/RenderMaterial'
import { createStateMaterial, createVelocityStateMaterial } from '../simulation/StateMaterial'
import {
  createMassRenderTargets,
  createMassGridMaterial,
  createMassNormalizeMaterial
} from '../simulation/MassTexture'
import {
  createReductionChain,
  runReductionChain
} from '../simulation/ReductionMaterial'
import { TEXTURE_SIZE, PARTICLE_COUNT } from '../utils/constants'

export default function ParticleSystem() {
  const { gl } = useThree()
  const pointsRef = useRef<THREE.Points>(null)
  const lastCountTime = useRef(0)
  const simulationTime = useRef(0)

  const {
    isPlaying,
    timeScale,
    gravitationalConstant,
    useBarnesHut,
    resetKey,
    setCurrentTime,
    setParticleCounts
  } = useSimulationStore()

  // Initialize FBO textures and render targets
  const fbo = useMemo(() => {
    // Initial data textures
    const positionTexture = createPositionTexture()
    const velocityTexture = createVelocityTexture(positionTexture)

    // Create two render targets for ping-pong rendering
    const rtOptions = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
      depthBuffer: false
    }

    const positionRT1 = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, rtOptions)
    const positionRT2 = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, rtOptions)
    const velocityRT1 = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, rtOptions)
    const velocityRT2 = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, rtOptions)

    // Create mass distribution render targets for Barnes-Hut
    const { massRT } = createMassRenderTargets()
    // Second render target for ping-pong (accumulation vs normalized)
    const massRT2 = createMassRenderTargets().massRT

    // Copy initial data to render targets using a shader that preserves RGBA
    const initScene = new THREE.Scene()
    const initCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Custom shader material to copy texture data (preserves all 4 channels)
    const copyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
        }
      `
    })

    const initQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      copyMaterial
    )
    initScene.add(initQuad)

    // Initialize position RT
    copyMaterial.uniforms.tDiffuse.value = positionTexture
    gl.setRenderTarget(positionRT1)
    gl.render(initScene, initCamera)

    // Initialize velocity RT
    copyMaterial.uniforms.tDiffuse.value = velocityTexture
    gl.setRenderTarget(velocityRT1)
    gl.render(initScene, initCamera)

    gl.setRenderTarget(null)

    // Cleanup
    initQuad.geometry.dispose()
    copyMaterial.dispose()
    positionTexture.dispose()
    velocityTexture.dispose()

    return {
      positionRT1,
      positionRT2,
      velocityRT1,
      velocityRT2,
      massRT,
      massRT2,
      currentPositionIndex: 0, // 0 or 1 for ping-pong
      currentVelocityIndex: 0
    }
  }, [gl, resetKey]) // Reinitialize particles when resetKey changes

  // Reset simulation time when resetKey changes
  useEffect(() => {
    simulationTime.current = 0
    lastCountTime.current = 0
  }, [resetKey])

  // Create simulation materials (for physics calculation)
  const {
    simulationScene,
    simulationCamera,
    velocityMaterial,
    positionMaterial,
    stateMaterial,
    velocityStateMaterial,
    massGridScene,
    massGridMaterial,
    massNormalizeMaterial,
    normalizeScene,
    reductionChain
  } = useMemo(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)

    // Material for velocity update (gravity calculations) - includes mass texture
    const matVelocity = createVelocityMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture,
      TEXTURE_SIZE,
      fbo.massRT.texture,
      useBarnesHut // Toggle between Barnes-Hut and old method
    )

    // Material for position update (integrate velocity)
    const matPosition = createPositionMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture
    )

    // Material for state update (particle type transitions)
    const matState = createStateMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture,
      fbo.massRT2.texture
    )

    // Material for velocity state update (temperature changes + heating from stars)
    const matVelocityState = createVelocityStateMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture,
      fbo.massRT2.texture
    )

    const mesh = new THREE.Mesh(geometry, matVelocity)
    scene.add(mesh)

    // Mass grid scene - renders particles as points to build mass distribution
    const massScene = new THREE.Scene()
    const massGridMat = createMassGridMaterial(fbo.positionRT1.texture, TEXTURE_SIZE)

    // Create points geometry for mass grid (same UVs as particle rendering)
    const massGridGeometry = new THREE.BufferGeometry()
    const uvs = createParticleUVs(TEXTURE_SIZE)
    massGridGeometry.setAttribute('particleUv', new THREE.BufferAttribute(uvs, 2))
    massGridGeometry.setDrawRange(0, PARTICLE_COUNT)

    const massGridPoints = new THREE.Points(massGridGeometry, massGridMat)
    massScene.add(massGridPoints)

    // Mass normalization material (converts accumulated mass to center of mass)
    const massNormMat = createMassNormalizeMaterial(fbo.massRT.texture)
    const normalizeMesh = new THREE.Mesh(geometry, massNormMat)
    const normalizeScene = new THREE.Scene()
    normalizeScene.add(normalizeMesh)

    // GPU-based particle counting reduction chain
    const reductionChain = createReductionChain(TEXTURE_SIZE)

    return {
      simulationScene: scene,
      simulationCamera: camera,
      velocityMaterial: matVelocity,
      positionMaterial: matPosition,
      stateMaterial: matState,
      velocityStateMaterial: matVelocityState,
      massGridScene: massScene,
      massGridMaterial: massGridMat,
      massNormalizeMaterial: massNormMat,
      normalizeScene,
      reductionChain
    }
  }, [fbo, useBarnesHut, resetKey]) // Recreate materials when toggle changes or reset

  // Create particle geometry for rendering
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()

    // Create particle UVs for sampling the FBO texture
    const uvs = createParticleUVs(TEXTURE_SIZE)

    geometry.setAttribute('particleUv', new THREE.BufferAttribute(uvs, 2))
    geometry.setDrawRange(0, PARTICLE_COUNT)

    return geometry
  }, [])

  // Create render material (for visualization)
  const renderMaterial = useMemo(() => {
    return createRenderMaterial(fbo.positionRT1.texture, fbo.velocityRT1.texture)
  }, [fbo])

  // Simulation loop
  useFrame((_state, delta) => {
    if (!isPlaying) return

    const scaledDelta = delta * timeScale

    // Update uniforms
    simulationTime.current += scaledDelta
    setCurrentTime(simulationTime.current)

    // Get current render targets
    const posReadRT = fbo.currentPositionIndex === 0 ? fbo.positionRT1 : fbo.positionRT2
    const posWriteRT = fbo.currentPositionIndex === 0 ? fbo.positionRT2 : fbo.positionRT1
    const velReadRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT1 : fbo.velocityRT2
    const velWriteRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT2 : fbo.velocityRT1

    const mesh = simulationScene.children[0] as THREE.Mesh

    // ===== BARNES-HUT MASS DISTRIBUTION PASSES =====
    // Only run these passes if Barnes-Hut is enabled
    if (useBarnesHut) {
      // PASS 0a: Clear mass accumulation buffer
      gl.setRenderTarget(fbo.massRT)
      gl.clear(true, false, false)

      // PASS 0b: Build mass distribution (accumulate mass at grid cells)
      // Each particle renders as a point at its grid cell, using additive blending
      massGridMaterial.uniforms.positionTexture.value = posReadRT.texture
      gl.setRenderTarget(fbo.massRT)
      gl.render(massGridScene, simulationCamera)

      // PASS 0c: Normalize mass distribution (convert weighted sum to center of mass)
      massNormalizeMaterial.uniforms.accumulatedMass.value = fbo.massRT.texture
      gl.setRenderTarget(fbo.massRT2)
      gl.render(normalizeScene, simulationCamera) // Use normalize scene for normalization pass

      // PASS 0d: Generate mipmaps for hierarchical sampling
      fbo.massRT2.texture.generateMipmaps = true
      gl.setRenderTarget(fbo.massRT2)
      fbo.massRT2.texture.needsUpdate = true
    }

    // ===== GRAVITY SIMULATION PASSES =====

    // PASS 1: Update velocity based on gravitational forces
    velocityMaterial.uniforms.positionTexture.value = posReadRT.texture
    velocityMaterial.uniforms.velocityTexture.value = velReadRT.texture

    // Only set mass texture if using Barnes-Hut (old shader doesn't use it)
    if (useBarnesHut && velocityMaterial.uniforms.massTexture) {
      velocityMaterial.uniforms.massTexture.value = fbo.massRT2.texture
    }

    velocityMaterial.uniforms.time.value = simulationTime.current
    velocityMaterial.uniforms.delta.value = scaledDelta
    velocityMaterial.uniforms.G.value = gravitationalConstant

    mesh.material = velocityMaterial
    gl.setRenderTarget(velWriteRT)
    gl.render(simulationScene, simulationCamera)

    // Swap velocity buffers
    fbo.currentVelocityIndex = 1 - fbo.currentVelocityIndex

    // PASS 2: Update position based on new velocity
    positionMaterial.uniforms.positionTexture.value = posReadRT.texture
    positionMaterial.uniforms.velocityTexture.value = velWriteRT.texture
    positionMaterial.uniforms.delta.value = scaledDelta

    mesh.material = positionMaterial
    gl.setRenderTarget(posWriteRT)
    gl.render(simulationScene, simulationCamera)

    // Swap position buffers
    fbo.currentPositionIndex = 1 - fbo.currentPositionIndex

    // PASS 3: Update particle states (type transitions: gas → star)
    // Only run state updates if Barnes-Hut is enabled (needs mass texture for density)
    if (useBarnesHut) {
      const stateReadRT = fbo.currentPositionIndex === 0 ? fbo.positionRT1 : fbo.positionRT2
      const stateWriteRT = fbo.currentPositionIndex === 0 ? fbo.positionRT2 : fbo.positionRT1

      stateMaterial.uniforms.positionTexture.value = stateReadRT.texture
      stateMaterial.uniforms.velocityTexture.value = velWriteRT.texture
      stateMaterial.uniforms.massTexture.value = fbo.massRT2.texture
      stateMaterial.uniforms.time.value = simulationTime.current
      stateMaterial.uniforms.delta.value = scaledDelta

      mesh.material = stateMaterial
      gl.setRenderTarget(stateWriteRT)
      gl.render(simulationScene, simulationCamera)

      // Swap position buffers
      fbo.currentPositionIndex = 1 - fbo.currentPositionIndex

      // PASS 3b: Update velocity state (temperature changes for newly formed stars)
      const velStateReadRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT1 : fbo.velocityRT2
      const velStateWriteRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT2 : fbo.velocityRT1
      const finalPosRT = fbo.currentPositionIndex === 0 ? fbo.positionRT1 : fbo.positionRT2

      velocityStateMaterial.uniforms.positionTexture.value = finalPosRT.texture
      velocityStateMaterial.uniforms.velocityTexture.value = velStateReadRT.texture
      velocityStateMaterial.uniforms.massTexture.value = fbo.massRT2.texture
      velocityStateMaterial.uniforms.time.value = simulationTime.current
      velocityStateMaterial.uniforms.delta.value = scaledDelta

      mesh.material = velocityStateMaterial
      gl.setRenderTarget(velStateWriteRT)
      gl.render(simulationScene, simulationCamera)

      // Swap velocity buffers
      fbo.currentVelocityIndex = 1 - fbo.currentVelocityIndex
    }

    // Update render material to use latest position and velocity textures
    const finalPosRT = fbo.currentPositionIndex === 0 ? fbo.positionRT1 : fbo.positionRT2
    const finalVelRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT1 : fbo.velocityRT2
    renderMaterial.uniforms.positionTexture.value = finalPosRT.texture
    renderMaterial.uniforms.velocityTexture.value = finalVelRT.texture

    // Reset render target
    gl.setRenderTarget(null)

    // Count particle types every 2 seconds using GPU reduction
    // Skip counting during fast-forward (timeScale > 20) for better performance
    if (simulationTime.current - lastCountTime.current > 2.0 && timeScale < 20) {
      lastCountTime.current = simulationTime.current

      // Run GPU-based particle counting (much faster than CPU readback!)
      const [darkMatter, gas, stars] = runReductionChain(
        gl,
        reductionChain,
        finalPosRT.texture,
        TEXTURE_SIZE
      )

      // Update store
      setParticleCounts(darkMatter, gas, stars)
    }
  })

  // Cleanup
  useEffect(() => {
    return () => {
      fbo.positionRT1.dispose()
      fbo.positionRT2.dispose()
      fbo.velocityRT1.dispose()
      fbo.velocityRT2.dispose()
      fbo.massRT.dispose()
      fbo.massRT2.dispose()
      particleGeometry.dispose()
      renderMaterial.dispose()
      velocityMaterial.dispose()
      positionMaterial.dispose()
      stateMaterial.dispose()
      velocityStateMaterial.dispose()
      massGridMaterial.dispose()
      massNormalizeMaterial.dispose()
      // Cleanup reduction chain
      reductionChain.renderTargets.forEach(rt => rt.dispose())
      reductionChain.materials.forEach(mat => mat.dispose())
    }
  }, [fbo, particleGeometry, renderMaterial, velocityMaterial, positionMaterial, stateMaterial, velocityStateMaterial, massGridMaterial, massNormalizeMaterial, reductionChain])

  return (
    <points ref={pointsRef} geometry={particleGeometry} material={renderMaterial} />
  )
}
