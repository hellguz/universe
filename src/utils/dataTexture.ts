import * as THREE from 'three'
import { TEXTURE_SIZE, INITIAL_SPREAD, INITIAL_VELOCITY_SPREAD, INITIAL_ROTATION_SPEED } from './constants'

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
 * Initialize particle positions in a disk galaxy distribution
 * Format: [x, y, z, type]
 *
 * Particle types:
 * 0.0 = Dark Matter (60%) - Extended halo around disk
 * 1.0 = Gas (35%) - Concentrated in disk plane
 * 2.0 = Stars (5%) - Concentrated in disk plane
 */
export function createPositionTexture(): THREE.DataTexture {
  const size = TEXTURE_SIZE
  const data = new Float32Array(size * size * 4)

  // Calculate type distribution thresholds - Scientific initial conditions
  // Universe starts with NO STARS (they form from gas over time)
  const darkMatterThreshold = 0.60 // 60% dark matter
  const gasThreshold = 1.00 // 40% gas, 0% stars initially

  for (let i = 0; i < size * size; i++) {
    const i4 = i * 4

    // Assign particle type based on random distribution
    const rand = Math.random()
    let particleType: number

    if (rand < darkMatterThreshold) {
      particleType = 0.0 // Dark Matter (60%)
    } else {
      particleType = 1.0 // Gas (40%) - all remaining particles are gas
      // NO STARS AT START - universe begins with only gas + dark matter!
    }

    // Disk galaxy distribution
    if (particleType === 0.0) {
      // Dark matter halo: spherical distribution with larger radius
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = Math.cbrt(Math.random()) * INITIAL_SPREAD * 1.5 // Larger halo

      data[i4 + 0] = radius * Math.sin(phi) * Math.cos(theta) // x
      data[i4 + 1] = radius * Math.sin(phi) * Math.sin(theta) // y
      data[i4 + 2] = radius * Math.cos(phi) // z
    } else {
      // Gas and stars: disk distribution with exponential radial profile
      const angle = Math.random() * Math.PI * 2

      // Exponential radial distribution (more particles near center)
      const u = Math.random()
      const radius = -Math.log(1 - u * 0.99) * INITIAL_SPREAD * 0.3 // Scale length

      // Disk plane (x-z) with small vertical scatter
      const diskThickness = particleType === 1.0 ? 0.1 : 0.05 // Gas slightly thicker
      const verticalScale = INITIAL_SPREAD * diskThickness

      data[i4 + 0] = radius * Math.cos(angle) // x
      data[i4 + 1] = (Math.random() - 0.5) * verticalScale // y (thin disk)
      data[i4 + 2] = radius * Math.sin(angle) // z
    }

    data[i4 + 3] = particleType
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
 * Initialize particle velocities with disk rotation
 * Format: [vx, vy, vz, temperature]
 */
export function createVelocityTexture(positionTexture: THREE.DataTexture): THREE.DataTexture {
  const size = TEXTURE_SIZE
  const data = new Float32Array(size * size * 4)
  const posData = positionTexture.image.data as unknown as Float32Array

  for (let i = 0; i < size * size; i++) {
    const i4 = i * 4

    // Get particle position and type
    const x = posData[i4 + 0]
    const z = posData[i4 + 2]
    const particleType = posData[i4 + 3]

    // Calculate distance from galactic center in the disk plane (x-z)
    const r = Math.sqrt(x * x + z * z)

    // Assign temperature based on particle type and position
    let temperature = 0.5

    if (particleType > 0.5 && r > 0.01) {
      // Gas particles: apply rotational velocity from angular momentum
      // Flat rotation curve (typical of spiral galaxies due to dark matter)
      const rotationSpeed = INITIAL_ROTATION_SPEED // Base rotation from constants

      // Circular velocity perpendicular to radius in x-z plane
      const angle = Math.atan2(z, x)
      const vx = -rotationSpeed * Math.sin(angle)
      const vz = rotationSpeed * Math.cos(angle)

      data[i4 + 0] = vx + (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD * 0.3 // vx with turbulence
      data[i4 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD * 0.1 // vy (minimal vertical motion)
      data[i4 + 2] = vz + (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD * 0.3 // vz with turbulence

      // Gas temperature: Primordial gas starts warm (cools rapidly to formation range)
      // Starting closer to formation range (0.1-0.4) for faster star formation
      temperature = 0.5 + Math.random() * 0.2 // 0.5-0.7 (warm, cools in ~5 seconds)
      // Note: No stars exist yet, so no age initialization needed
    } else {
      // Dark matter halo: small random velocities
      data[i4 + 0] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD * 0.5 // vx
      data[i4 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD * 0.5 // vy
      data[i4 + 2] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD * 0.5 // vz

      // Dark matter: no temperature (doesn't interact electromagnetically)
      temperature = 0.0
    }

    data[i4 + 3] = temperature
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
