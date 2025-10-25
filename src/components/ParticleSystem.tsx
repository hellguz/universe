import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../store/simulationStore'
import {
  createPositionTexture,
  createVelocityTexture,
  createParticleUVs
} from '../utils/dataTexture'
import { createSimulationMaterial } from '../simulation/SimulationMaterial'
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
  const { simulationScene, simulationCamera, simulationMaterialPosition, simulationMaterialVelocity } = useMemo(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)

    // Material for position update
    const matPosition = createSimulationMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture,
      TEXTURE_SIZE
    )

    // Material for velocity update (same shader, different output)
    const matVelocity = createSimulationMaterial(
      fbo.positionRT1.texture,
      fbo.velocityRT1.texture,
      TEXTURE_SIZE
    )

    const mesh = new THREE.Mesh(geometry, matPosition)
    scene.add(mesh)

    return {
      simulationScene: scene,
      simulationCamera: camera,
      simulationMaterialPosition: matPosition,
      simulationMaterialVelocity: matVelocity
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
    // const velWriteRT = fbo.currentVelocityIndex === 0 ? fbo.velocityRT2 : fbo.velocityRT1 // For future use

    // Update simulation material uniforms
    simulationMaterialPosition.uniforms.positionTexture.value = posReadRT.texture
    simulationMaterialPosition.uniforms.velocityTexture.value = velReadRT.texture
    simulationMaterialPosition.uniforms.time.value = time
    simulationMaterialPosition.uniforms.delta.value = scaledDelta
    simulationMaterialPosition.uniforms.G.value = gravitationalConstant

    simulationMaterialVelocity.uniforms.positionTexture.value = posReadRT.texture
    simulationMaterialVelocity.uniforms.velocityTexture.value = velReadRT.texture
    simulationMaterialVelocity.uniforms.time.value = time
    simulationMaterialVelocity.uniforms.delta.value = scaledDelta
    simulationMaterialVelocity.uniforms.G.value = gravitationalConstant

    // Run simulation (physics pass)
    // Note: For full implementation, we'd need MRT (Multiple Render Targets) to update both position and velocity
    // For simplicity in Phase 1, we'll update position based on velocity

    // Update position
    const mesh = simulationScene.children[0] as THREE.Mesh
    mesh.material = simulationMaterialPosition
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
      simulationMaterialPosition.dispose()
      simulationMaterialVelocity.dispose()
    }
  }, [])

  return (
    <points ref={pointsRef} geometry={particleGeometry} material={renderMaterial} />
  )
}
