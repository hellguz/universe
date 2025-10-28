import * as THREE from 'three'
import { TEXTURE_SIZE, INITIAL_SPREAD, INITIAL_VELOCITY_SPREAD, TIDAL_ANGULAR_MOMENTUM } from './constants'

/**
 * Simple 3D hash function for pseudo-random values
 * Returns value in range [-1, 1]
 */
function hash3D(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1 // Map [0, 1] to [-1, 1]
}

/**
 * 3D noise function with multiple octaves (Perlin-like)
 * Creates smooth, organic density variations
 * Returns value in approximate range [-1, 1]
 */
function noise3D(x: number, y: number, z: number): number {
  let value = 0
  let amplitude = 1
  let frequency = 1

  // Multiple octaves for natural-looking variation
  for (let octave = 0; octave < 4; octave++) {
    value += amplitude * hash3D(x * frequency, y * frequency, z * frequency)
    amplitude *= 0.5 // Each octave contributes less
    frequency *= 2   // Each octave has finer detail
  }

  return value
}

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
 * Initialize particle positions with NATURAL STRUCTURE FORMATION
 * Spherical distribution + smooth 3D noise density perturbations
 * Format: [x, y, z, type]
 *
 * Particle types:
 * 0.0 = Dark Matter (60%) - Spherical with smooth perturbations
 * 1.0 = Gas (40%) - Spherical with smooth perturbations
 * 2.0 = Stars (0%) - None at Big Bang, will form naturally during simulation
 *
 * Method: Noise-based density field
 * - Base: Uniform spherical distribution (120 units radius)
 * - Apply: Multi-octave 3D noise (Perlin-like) for smooth density variations
 * - Result: Organic, cloud-like structure with NO hard boundaries
 * - Gravity amplifies these density variations → galaxies form naturally!
 */
export function createPositionTexture(): THREE.DataTexture {
  const size = TEXTURE_SIZE
  const data = new Float32Array(size * size * 4)

  // Calculate type distribution thresholds
  // REALISTIC: No stars at t=0 (Big Bang), only dark matter and primordial gas
  const darkMatterThreshold = 0.60 // 60% dark matter, 40% gas (remaining)
  // 0% stars - all stars will form naturally during simulation!

  // Noise parameters for smooth density variations
  const noiseScale = 0.015 // Frequency of density variations (smaller = larger features)
  const perturbationStrength = 0.25 // How much noise affects position (0.25 = 25% shift)

  for (let i = 0; i < size * size; i++) {
    const i4 = i * 4

    // Assign particle type based on random distribution
    const rand = Math.random()
    let particleType: number

    if (rand < darkMatterThreshold) {
      particleType = 0.0 // Dark Matter (60%)
    } else {
      particleType = 1.0 // Gas (40%) - Primordial hydrogen and helium
    }

    // ===== SPHERICAL DISTRIBUTION (Base) =====
    // Distribute particles uniformly within a sphere (not cube!)
    const theta = Math.random() * Math.PI * 2 // Azimuthal angle
    const phi = Math.acos(2 * Math.random() - 1) // Polar angle (uniform on sphere)
    const r = Math.cbrt(Math.random()) * INITIAL_SPREAD // Uniform volume distribution

    // Convert spherical to Cartesian coordinates
    let x = r * Math.sin(phi) * Math.cos(theta)
    let y = r * Math.sin(phi) * Math.sin(theta)
    let z = r * Math.cos(phi)

    // ===== APPLY SMOOTH DENSITY PERTURBATIONS (Noise-based) =====
    // Sample 3D noise field at this position
    const densityBias = noise3D(x * noiseScale, y * noiseScale, z * noiseScale)

    // Shift position based on density field (creates organic clustering)
    // Positive densityBias → shift outward, negative → shift inward
    x += densityBias * perturbationStrength * INITIAL_SPREAD * 0.3
    y += densityBias * perturbationStrength * INITIAL_SPREAD * 0.3
    z += densityBias * perturbationStrength * INITIAL_SPREAD * 0.3

    data[i4 + 0] = x
    data[i4 + 1] = y
    data[i4 + 2] = z
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
 * Initialize particle velocities for NATURAL STRUCTURE FORMATION
 * Includes tidal angular momentum - small-scale rotation in proto-galaxy regions
 * Simulates tidal torque theory: proto-galaxies acquire spin from nearby structures
 * Format: [vx, vy, vz, temperature]
 */
export function createVelocityTexture(positionTexture: THREE.DataTexture): THREE.DataTexture {
  const size = TEXTURE_SIZE
  const data = new Float32Array(size * size * 4)
  const posData = positionTexture.image.data as unknown as Float32Array

  // ===== TIDAL ANGULAR MOMENTUM SETUP =====
  // Divide universe into regions for proto-galaxy spin generation
  const regionGridSize = 8 // 8x8x8 = 512 proto-galaxy regions
  const regionSize = (INITIAL_SPREAD * 2) / regionGridSize // Size of each region

  // Generate random rotation axis for each region (tidal torque from density correlations)
  const rotationAxes = new Map<string, THREE.Vector3>()
  for (let rx = 0; rx < regionGridSize; rx++) {
    for (let ry = 0; ry < regionGridSize; ry++) {
      for (let rz = 0; rz < regionGridSize; rz++) {
        const key = `${rx},${ry},${rz}`
        // Random unit vector for rotation axis
        const axis = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
        // Scale by tidal torque strength with some variation (0.5x to 1.5x)
        axis.multiplyScalar(TIDAL_ANGULAR_MOMENTUM * (0.5 + Math.random()))
        rotationAxes.set(key, axis)
      }
    }
  }

  for (let i = 0; i < size * size; i++) {
    const i4 = i * 4

    // Get particle position and type
    const px = posData[i4 + 0]
    const py = posData[i4 + 1]
    const pz = posData[i4 + 2]
    const particleType = posData[i4 + 3]
    const position = new THREE.Vector3(px, py, pz)

    // Determine which region this particle belongs to
    const rx = Math.floor((px + INITIAL_SPREAD) / regionSize)
    const ry = Math.floor((py + INITIAL_SPREAD) / regionSize)
    const rz = Math.floor((pz + INITIAL_SPREAD) / regionSize)
    const key = `${Math.max(0, Math.min(regionGridSize - 1, rx))},${Math.max(0, Math.min(regionGridSize - 1, ry))},${Math.max(0, Math.min(regionGridSize - 1, rz))}`

    // Get region's rotation axis (tidal angular momentum vector)
    const angularMomentum = rotationAxes.get(key) || new THREE.Vector3(0, 0, 0)

    // Calculate region center
    const regionCenterX = (rx - regionGridSize / 2 + 0.5) * regionSize
    const regionCenterY = (ry - regionGridSize / 2 + 0.5) * regionSize
    const regionCenterZ = (rz - regionGridSize / 2 + 0.5) * regionSize
    const regionCenter = new THREE.Vector3(regionCenterX, regionCenterY, regionCenterZ)

    // Calculate tangential velocity: v = ω × r (where r is offset from region center)
    const r = position.clone().sub(regionCenter)
    const tangentialVel = angularMomentum.clone().cross(r)

    // Assign temperature based on particle type
    let temperature = 0.5

    if (particleType > 0.5 && particleType < 1.5) {
      // Gas particles: thermal motion + tidal angular momentum
      data[i4 + 0] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.x
      data[i4 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.y
      data[i4 + 2] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.z

      // Gas temperature: Primordial gas starts HOT (like early universe after recombination)
      // Must cool significantly before reaching star formation range (0.1-0.4)
      temperature = 0.80 + Math.random() * 0.15 // 0.80-0.95 (hot, needs ~100+ seconds to cool to formation range)
    } else if (particleType > 1.5) {
      // Stars: thermal motion + tidal angular momentum (shouldn't exist at t=0, but just in case)
      data[i4 + 0] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.x
      data[i4 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.y
      data[i4 + 2] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.z

      // Stars start as newborn (age = 0.0)
      temperature = 0.0
    } else {
      // Dark matter: thermal motion + tidal angular momentum
      data[i4 + 0] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.x
      data[i4 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.y
      data[i4 + 2] = (Math.random() - 0.5) * INITIAL_VELOCITY_SPREAD + tangentialVel.z

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
