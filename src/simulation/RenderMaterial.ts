import * as THREE from 'three'
import renderVertexShader from '../shaders/render/vertex.glsl'
import renderFragmentShader from '../shaders/render/fragment.glsl'
import { PARTICLE_SIZE } from '../utils/constants'

export function createRenderMaterial(
  positionTexture: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      positionTexture: { value: positionTexture },
      particleSize: { value: PARTICLE_SIZE }
    },
    vertexShader: renderVertexShader,
    fragmentShader: renderFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  })
}
