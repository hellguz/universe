import * as THREE from 'three'
import simulationVertexShader from '../shaders/simulation/vertex.glsl'
import simulationFragmentShader from '../shaders/simulation/fragment.glsl'

export function createSimulationMaterial(
  positionTexture: THREE.Texture,
  velocityTexture: THREE.Texture,
  textureSize: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      positionTexture: { value: positionTexture },
      velocityTexture: { value: velocityTexture },
      time: { value: 0 },
      delta: { value: 0 },
      G: { value: 0.0001 },
      textureSize: { value: textureSize }
    },
    vertexShader: simulationVertexShader,
    fragmentShader: simulationFragmentShader
  })
}
