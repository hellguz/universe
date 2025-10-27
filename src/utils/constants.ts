/**
 * Physical and simulation constants for the Universe Simulator
 */

// Simulation settings
export const TEXTURE_SIZE = 1500 // 1500x1500 = 2,250,000 particles (2.25M)
export const PARTICLE_COUNT = TEXTURE_SIZE * TEXTURE_SIZE

// Barnes-Hut Octree settings
export const MASS_GRID_SIZE = 64 // 3D grid resolution for mass distribution (64³ = 262K cells)
export const MASS_GRID_TEXTURE_SIZE = 512 // 2D texture size to store flattened 3D grid (8x8 layers of 64x64)
export const MASS_GRID_WORLD_SIZE = 300.0 // World space size covered by mass grid (increased for larger spread)
export const BARNES_HUT_THETA = 0.5 // Opening angle criterion (0.5 = good balance)

// Distance thresholds for hierarchical approximation
export const NEAR_FIELD_DISTANCE = 40.0 // Use individual particles
export const MID_FIELD_DISTANCE = 200.0 // Use small clusters (fine mipmap levels)
export const FAR_FIELD_DISTANCE = 500.0 // Use large clusters (coarse mipmap levels)

// Performance settings - Fixed Sample Budget (fallback if Barnes-Hut disabled)
export const SAMPLES_PER_PARTICLE = 128 // Fixed computational budget per particle
export const GRAVITY_CUTOFF_DISTANCE = 80.0 // Only check nearby particles

// Physics constants (scaled for simulation)
export const GRAVITATIONAL_CONSTANT = 0.0001 // Scaled G for visible effects
export const TIMESTEP = 0.016 // ~60fps
export const SOFTENING_LENGTH = 8 // Prevent singularities (larger for more particles)

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

// Universe time scaling: 1 real second = X million years
export const UNIVERSE_TIME_SCALE = 20 // 1 sim second = 20 million years (Myr)
// At this scale: 10 minutes = 12,000 Myr = 12 Gyr (billion years)

// Camera
export const CAMERA_POSITION: [number, number, number] = [0, 50, 100]
export const CAMERA_FOV = 75
export const CAMERA_NEAR = 0.1
export const CAMERA_FAR = 10000

// Star Formation & Evolution
export const STAR_FORMATION_DENSITY_THRESHOLD = 0.8 // Mass units per cell for star formation (lowered to match actual clustering)
export const STAR_FORMATION_TEMP_MIN = 0.1 // Minimum temperature for star formation (cold molecular clouds)
export const STAR_FORMATION_TEMP_MAX = 0.4 // Maximum temperature for star formation (cool, not hot)
export const STAR_FORMATION_RATE = 0.002 // Probability per frame (0.2% chance when conditions met - realistic gradual formation)

// Stellar Evolution - Balanced timescales for watchable simulation
export const STELLAR_AGING_RATE = 0.0002 // Stars age at visible pace: red giants at ~8-10 min, white dwarfs at ~12-15 min (4x faster)
export const RED_GIANT_AGE_THRESHOLD = 0.7 // Stars become red giants at this age (~3-4 minutes)
export const WHITE_DWARF_AGE_THRESHOLD = 0.95 // Red giants become white dwarfs at this age (~5 minutes)
export const SUPERNOVA_AGE_THRESHOLD = 0.85 // Massive stars explode at this age (future feature)

// Gas Evolution - Realistic cooling timescales
export const GAS_COOLING_RATE = 0.00002 // Gas cools gradually over ~1-2 minutes (molecular cloud formation)
