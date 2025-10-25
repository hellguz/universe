import * as THREE from 'three'
import { TEXTURE_SIZE, INITIAL_SPREAD, INITIAL_VELOCITY_SPREAD } from './constants'

/**
 * Creates a Float32 data texture for FBO particle simulation
 */
export function createDataTexture(size: number): THREE.DataTexture {
  const data = new Float32Array(size * size * 4) // RGBA

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType
  )

  texture.needsUpdate = true
  return texture
}

/**
 * Initialize particle positions in a random sphere distribution
 * Format: [x, y, z, mass]
 */
export function createPositionTexture(): THREE.DataTexture {
  const size = TEXTURE_SIZE
  const data = new Float32Array(size * size * 4)

  for (let i = 0; i < size * size; i++) {
    const i4 = i * 4

    // Random position in sphere using spherical coordinates
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = Math.cbrt(Math.random()) * INITIAL_SPREAD // Cubic root for uniform distribution

    data[i4 + 0] = radius * Math.sin(phi) * Math.cos(theta) // x
    data[i4 + 1] = radius * Math.sin(phi) * Math.sin(theta) // y
    data[i4 + 2] = radius * Math.cos(phi) // z
    data[i4 + 3] = 1.0 // mass (uniform for now)
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType
  )

  texture.needsUpdate = true
  return texture
}

/**
 * Initialize particle velocities (start at rest with small random velocities)
 * Format: [vx, vy, vz, temperature]
 */
export function createVelocityTexture(): THREE.DataTexture {
  const size = TEXTURE_SIZE
  const data = new Float32Array(size * size * 4)

  for (let i = 0; i < size * size; i++) {
    const i4 = i * 4

    // Small random initial velocities
    data[i4 + 0] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD // vx
    data[i4 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD // vy
    data[i4 + 2] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD // vz
    data[i4 + 3] = 1.0 // temperature (unused for now)
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType
  )

  texture.needsUpdate = true
  return texture
}

/**
 * Create UVs for sampling the FBO textures
 */
export function createParticleUVs(size: number): Float32Array {
  const uvs = new Float32Array(size * size * 2)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 2
      uvs[index + 0] = (x + 0.5) / size // u
      uvs[index + 1] = (y + 0.5) / size // v
    }
  }

  return uvs
}
