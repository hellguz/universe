/**
 * Physical and simulation constants for the Universe Simulator
 */

// Simulation settings
export const TEXTURE_SIZE = 1500 // 1500x1500 = 2.25 million particles
export const PARTICLE_COUNT = TEXTURE_SIZE * TEXTURE_SIZE

// Barnes-Hut Octree settings
export const MASS_GRID_SIZE = 64 // 3D grid resolution for mass distribution (64³ = 262K cells)
export const MASS_GRID_TEXTURE_SIZE = 512 // 2D texture size to store flattened 3D grid (8x8 layers of 64x64)
export const MASS_GRID_WORLD_SIZE = 300.0 // World space size covered by mass grid (increased for larger spread)
export const BARNES_HUT_THETA = 0.5 // Opening angle criterion (0.5 = good balance)

// Distance thresholds for hierarchical approximation
export const NEAR_FIELD_DISTANCE = 60.0 // Use individual particles
export const MID_FIELD_DISTANCE = 200.0 // Use small clusters (fine mipmap levels)
export const FAR_FIELD_DISTANCE = 600.0 // Use large clusters (coarse mipmap levels)

// Performance settings - Fixed Sample Budget (fallback if Barnes-Hut disabled)
export const SAMPLES_PER_PARTICLE = 128 // Fixed computational budget per particle
export const GRAVITY_CUTOFF_DISTANCE = 80.0 // Only check nearby particles

// Physics constants (scaled for simulation)
export const GRAVITATIONAL_CONSTANT = 0.0001 // Scaled G for visible effects
export const TIMESTEP = 0.016 // ~60fps
export const SOFTENING_LENGTH = 6 // Prevent singularities (larger for more particles)

// Initial conditions
export const INITIAL_SPREAD = 80 // Sphere radius for initial distribution (larger for more particles)
export const INITIAL_VELOCITY_SPREAD = 0.05 // Random velocity magnitude (reduced for stability)
export const INITIAL_ROTATION_SPEED = 0.08 // Base rotation speed for galaxy (angular momentum conservation)

// Rendering - optimized for high particle count
export const PARTICLE_SIZE = 0.3
export const PARTICLE_COLOR = [1.0, 1.0, 1.0] // White

// Time controls
export const MIN_TIME_SCALE = 1
export const MAX_TIME_SCALE = 10
export const DEFAULT_TIME_SCALE = 1

// Universe time scaling: EXACT scientific mapping - 10 minutes = 13.8 Gyr
export const UNIVERSE_TIME_SCALE = 23 // 1 sim second = 23 million years (Myr)
// Calculation: 13,800 Myr / 600 seconds = 23 Myr/s
// At this scale: 10 minutes = 600s × 23 Myr = 13,800 Myr = 13.8 Gyr ✓

// Camera
export const CAMERA_POSITION: [number, number, number] = [0, 50, 100]
export const CAMERA_FOV = 75
export const CAMERA_NEAR = 0.01
export const CAMERA_FAR = 10000

// Star Formation & Evolution - Scientific timescales
export const STAR_FORMATION_DENSITY_THRESHOLD = 0.8 // Mass units per cell for star formation
export const STAR_FORMATION_TEMP_MIN = 0.1 // Minimum temperature for star formation (cold molecular clouds)
export const STAR_FORMATION_TEMP_MAX = 0.4 // Maximum temperature for star formation (cool, not hot)
export const STAR_FORMATION_RATE = 0.0003 // Probability per frame (0.03% - gradual star formation over cosmic history)

// Stellar Evolution - Calibrated for realistic 10 Gyr main sequence lifetime
export const STELLAR_AGING_RATE = 0.00161 // Stars reach red giant phase (0.7) at 10 Gyr universe age (434.78 sim seconds)
export const RED_GIANT_AGE_THRESHOLD = 0.7 // Stars become red giants at this age (~10 Gyr in real time)
export const WHITE_DWARF_AGE_THRESHOLD = 0.95 // Red giants become white dwarfs at this age (~11 Gyr in real time)

// Supernova & Compact Objects
export const SUPERNOVA_AGE_THRESHOLD = 0.85 // Massive stars explode at this age (~8-9 Gyr)
export const SUPERNOVA_RADIUS = 30.0 // Explosion blast radius (world units) - DOUBLED for dramatic effect!
export const SUPERNOVA_VELOCITY_BOOST = 50.0 // Ejecta speed multiplier - MASSIVE shockwave!
export const SUPERNOVA_PROBABILITY = 0.02 // 2% of stars go supernova (realistic: only massive stars >10 M☉)
export const BLACK_HOLE_PROBABILITY = 0.2 // 20% of supernovae create black holes, 80% neutron stars (realistic 4:1 ratio)
export const BLACK_HOLE_ACCRETION_RADIUS = 5.0 // Gas heating zone around black holes
export const BLACK_HOLE_GRAVITY_MULTIPLIER = 3.0 // Enhanced gravitational pull

// Gas Evolution - Realistic primordial gas cooling from hot early universe
export const GAS_COOLING_RATE = 0.022 // Hot primordial gas (0.8-0.95) cools to star formation range (0.1-0.4) over ~500 Myr
