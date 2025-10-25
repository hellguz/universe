/**
 * Type definitions for the Universe Simulator
 */

import * as THREE from 'three'

export interface ParticleData {
  position: Float32Array // x, y, z, mass
  velocity: Float32Array // vx, vy, vz, temperature
}

export interface SimulationParams {
  particleCount: number
  gravitationalConstant: number
  timeScale: number
  isPlaying: boolean
  deltaTime: number
}

export interface ParticleType {
  GAS: 0
  DARK_MATTER: 1
  STAR: 2
  COMPACT_OBJECT: 3
}

export interface UniformsType {
  positionTexture: { value: THREE.Texture | null }
  velocityTexture: { value: THREE.Texture | null }
  time: { value: number }
  delta: { value: number }
  G: { value: number }
  textureSize: { value: number }
}

export type { }
