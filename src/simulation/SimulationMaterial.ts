import * as THREE from 'three'
import simulationVertexShader from '../shaders/simulation/vertex.glsl'
import velocityFragmentShader from '../shaders/simulation/velocityFragment.glsl'
import positionFragmentShader from '../shaders/simulation/positionFragment.glsl'

export function createVelocityMaterial(
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
    fragmentShader: velocityFragmentShader
  })
}

export function createPositionMaterial(
  positionTexture: THREE.Texture,
  velocityTexture: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      positionTexture: { value: positionTexture },
      velocityTexture: { value: velocityTexture },
      delta: { value: 0 }
    },
    vertexShader: simulationVertexShader,
    fragmentShader: positionFragmentShader
  })
}
