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
import { TEXTURE_SIZE, PARTICLE_COUNT } from '../utils/constants'

export default function ParticleSystem() {
  const { gl } = useThree()
  const pointsRef = useRef<THREE.Points>(null)

  const {
    isPlaying,
    timeScale,
    gravitationalConstant,
    setCurrentTime
  } = useSimulationStore()

  // Initialize FBO textures and render targets
  const fbo = useMemo(() => {
    // Initial data textures
    const positionTexture = createPositionTexture()
    const velocityTexture = createVelocityTexture()

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

    // Copy initial data to render targets
    const initScene = new THREE.Scene()
    const initCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const initQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: positionTexture })
    )
    initScene.add(initQuad)

    // Initialize position RT
    gl.setRenderTarget(positionRT1)
    gl.render(initScene, initCamera)

    // Initialize velocity RT
    initQuad.material.map = velocityTexture
    gl.setRenderTarget(velocityRT1)
    gl.render(initScene, initCamera)

    gl.setRenderTarget(null)

    // Cleanup
    initQuad.geometry.dispose()
    initQuad.material.dispose()
    positionTexture.dispose()
    velocityTexture.dispose()

    return {
      positionRT1,
      positionRT2,
      velocityRT1,
      velocityRT2,
      currentPositionIndex: 0, // 0 or 1 for ping-pong
      currentVelocityIndex: 0
    }
  }, [gl])

  // Create simulation materials (for physics calculation)
  const { simulationScene, simulationCamera, velocityMaterial, positionMaterial } = useMemo(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)

    // Material for velocity update (gravity calculations)
    const matVelocity = createVelocityMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture,
      TEXTURE_SIZE
    )

    // Material for position update (integrate velocity)
    const matPosition = createPositionMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture
    )

    const mesh = new THREE.Mesh(geometry, matVelocity)
    scene.add(mesh)

    return {
      simulationScene: scene,
      simulationCamera: camera,
      velocityMaterial: matVelocity,
      positionMaterial: matPosition
    }
  }, [fbo])

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
    return createRenderMaterial(fbo.positionRT1.texture)
  }, [fbo])

  // Simulation loop
  let time = 0
  useFrame((_state, delta) => {
    if (!isPlaying) return

    const scaledDelta = delta * timeScale

    // Update uniforms
    time += scaledDelta
    setCurrentTime(time)

    // Get current render targets
    const posReadRT = fbo.currentPositionIndex === 0 ? fbo.positionRT1 : fbo.positionRT2
    const posWriteRT = fbo.currentPositionIndex === 0 ? fbo.positionRT2 : fbo.positionRT1
    const velReadRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT1 : fbo.velocityRT2
    const velWriteRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT2 : fbo.velocityRT1

    const mesh = simulationScene.children[0] as THREE.Mesh

    // PASS 1: Update velocity based on gravitational forces
    velocityMaterial.uniforms.positionTexture.value = posReadRT.texture
    velocityMaterial.uniforms.velocityTexture.value = velReadRT.texture
    velocityMaterial.uniforms.time.value = time
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

    // Update render material to use latest position texture
    renderMaterial.uniforms.positionTexture.value = posWriteRT.texture

    // Reset render target
    gl.setRenderTarget(null)
  })

  // Cleanup
  useEffect(() => {
    return () => {
      fbo.positionRT1.dispose()
      fbo.positionRT2.dispose()
      fbo.velocityRT1.dispose()
      fbo.velocityRT2.dispose()
      particleGeometry.dispose()
      renderMaterial.dispose()
      velocityMaterial.dispose()
      positionMaterial.dispose()
    }
  }, [fbo, particleGeometry, renderMaterial, velocityMaterial, positionMaterial])

  return (
    <points ref={pointsRef} geometry={particleGeometry} material={renderMaterial} />
  )
}
