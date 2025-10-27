/**
 * Physical and simulation constants for the Universe Simulator
 */

// Simulation settings
export const TEXTURE_SIZE = 1024 // 1024x1024 = 1,048,576 particles (1.05M)
export const PARTICLE_COUNT = TEXTURE_SIZE * TEXTURE_SIZE

// Barnes-Hut Octree settings
export const MASS_GRID_SIZE = 64 // 3D grid resolution for mass distribution (64³ = 262K cells)
export const MASS_GRID_TEXTURE_SIZE = 512 // 2D texture size to store flattened 3D grid (8x8 layers of 64x64)
export const MASS_GRID_WORLD_SIZE = 300.0 // World space size covered by mass grid (increased for larger spread)
export const BARNES_HUT_THETA = 0.5 // Opening angle criterion (0.5 = good balance)

// Distance thresholds for hierarchical approximation
export const NEAR_FIELD_DISTANCE = 20.0 // Use individual particles
export const MID_FIELD_DISTANCE = 50.0 // Use small clusters (fine mipmap levels)
export const FAR_FIELD_DISTANCE = 100.0 // Use large clusters (coarse mipmap levels)

// Performance settings - Fixed Sample Budget (fallback if Barnes-Hut disabled)
export const SAMPLES_PER_PARTICLE = 128 // Fixed computational budget per particle
export const GRAVITY_CUTOFF_DISTANCE = 80.0 // Only check nearby particles

// Physics constants (scaled for simulation)
export const GRAVITATIONAL_CONSTANT = 0.0001 // Scaled G for visible effects
export const TIMESTEP = 0.016 // ~60fps
export const SOFTENING_LENGTH = 2.5 // Prevent singularities (larger for more particles)

// Initial conditions
export const INITIAL_SPREAD = 80 // Sphere radius for initial distribution (larger for more particles)
export const INITIAL_VELOCITY_SPREAD = 0.08 // Random velocity magnitude (reduced for stability)

// Rendering - optimized for high particle count
export const PARTICLE_SIZE = 0.4
export const PARTICLE_COLOR = [1.0, 1.0, 1.0] // White

// Time controls
export const MIN_TIME_SCALE = 1
export const MAX_TIME_SCALE = 100
export const DEFAULT_TIME_SCALE = 1

// Camera
export const CAMERA_POSITION: [number, number, number] = [0, 50, 100]
export const CAMERA_FOV = 75
export const CAMERA_NEAR = 0.1
export const CAMERA_FAR = 10000

// Star Formation & Evolution
export const STAR_FORMATION_DENSITY_THRESHOLD = 2.5 // Mass units per cell for star formation (requires local clustering)
export const STAR_FORMATION_TEMP_MIN = 0.3 // Minimum temperature for star formation (not too cold)
export const STAR_FORMATION_TEMP_MAX = 0.8 // Maximum temperature for star formation (not too hot)
export const STAR_FORMATION_RATE = 0.02 // Probability per frame (2% chance when conditions met - gradual formation)
