import * as THREE from 'three'
import simulationVertexShader from '../shaders/simulation/vertex.glsl'
import velocityFragmentShader from '../shaders/simulation/velocityFragment.glsl'
import velocityFragmentShaderOld from '../shaders/simulation/velocityFragmentOld.glsl'
import positionFragmentShader from '../shaders/simulation/positionFragment.glsl'
import {
  MASS_GRID_SIZE,
  MASS_GRID_TEXTURE_SIZE,
  MASS_GRID_WORLD_SIZE,
  BARNES_HUT_THETA,
  NEAR_FIELD_DISTANCE,
  MID_FIELD_DISTANCE,
  FAR_FIELD_DISTANCE,
  SOFTENING_LENGTH
} from '../utils/constants'

export function createVelocityMaterial(
  positionTexture: THREE.Texture,
  velocityTexture: THREE.Texture,
  textureSize: number,
  massTexture?: THREE.Texture,
  useBarnesHut: boolean = true
): THREE.ShaderMaterial {
  // Use old simple method or Barnes-Hut based on toggle
  const fragmentShader = useBarnesHut ? velocityFragmentShader : velocityFragmentShaderOld

  return new THREE.ShaderMaterial({
    uniforms: {
      positionTexture: { value: positionTexture },
      velocityTexture: { value: velocityTexture },
      massTexture: { value: massTexture || null },
      time: { value: 0 },
      delta: { value: 0 },
      G: { value: 0.0001 },
      textureSize: { value: textureSize },
      // Barnes-Hut parameters (unused in old mode)
      gridSize: { value: MASS_GRID_SIZE },
      worldSize: { value: MASS_GRID_WORLD_SIZE },
      massTextureSize: { value: MASS_GRID_TEXTURE_SIZE },
      theta: { value: BARNES_HUT_THETA },
      nearFieldDist: { value: NEAR_FIELD_DISTANCE },
      midFieldDist: { value: MID_FIELD_DISTANCE },
      farFieldDist: { value: FAR_FIELD_DISTANCE },
      softeningLength: { value: SOFTENING_LENGTH }
    },
    vertexShader: simulationVertexShader,
    fragmentShader
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
      delta: { value: 0 },
      worldSize: { value: MASS_GRID_WORLD_SIZE }
    },
    vertexShader: simulationVertexShader,
    fragmentShader: positionFragmentShader
  })
}
