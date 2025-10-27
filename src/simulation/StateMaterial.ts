import * as THREE from 'three'
import simulationVertexShader from '../shaders/simulation/vertex.glsl'
import stateFragmentShader from '../shaders/simulation/stateFragment.glsl'
import velocityStateFragmentShader from '../shaders/simulation/velocityStateFragment.glsl'
import {
  MASS_GRID_SIZE,
  MASS_GRID_TEXTURE_SIZE,
  MASS_GRID_WORLD_SIZE,
  STAR_FORMATION_DENSITY_THRESHOLD,
  STAR_FORMATION_TEMP_MIN,
  STAR_FORMATION_TEMP_MAX,
  STAR_FORMATION_RATE,
  STELLAR_AGING_RATE,
  GAS_COOLING_RATE
} from '../utils/constants'

export function createStateMaterial(
  positionTexture: THREE.Texture,
  velocityTexture: THREE.Texture,
  massTexture: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      positionTexture: { value: positionTexture },
      velocityTexture: { value: velocityTexture },
      massTexture: { value: massTexture },
      time: { value: 0 },
      delta: { value: 0 },
      gridSize: { value: MASS_GRID_SIZE },
      worldSize: { value: MASS_GRID_WORLD_SIZE },
      massTextureSize: { value: MASS_GRID_TEXTURE_SIZE },
      formationDensity: { value: STAR_FORMATION_DENSITY_THRESHOLD },
      formationTempMin: { value: STAR_FORMATION_TEMP_MIN },
      formationTempMax: { value: STAR_FORMATION_TEMP_MAX },
      formationRate: { value: STAR_FORMATION_RATE }
    },
    vertexShader: simulationVertexShader,
    fragmentShader: stateFragmentShader
  })
}

export function createVelocityStateMaterial(
  positionTexture: THREE.Texture,
  velocityTexture: THREE.Texture,
  massTexture: THREE.Texture
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      positionTexture: { value: positionTexture },
      velocityTexture: { value: velocityTexture },
      massTexture: { value: massTexture },
      time: { value: 0 },
      delta: { value: 0 },
      agingRate: { value: STELLAR_AGING_RATE },
      coolingRate: { value: GAS_COOLING_RATE },
      gridSize: { value: MASS_GRID_SIZE },
      worldSize: { value: MASS_GRID_WORLD_SIZE },
      massTextureSize: { value: MASS_GRID_TEXTURE_SIZE }
    },
    vertexShader: simulationVertexShader,
    fragmentShader: velocityStateFragmentShader
  })
}
