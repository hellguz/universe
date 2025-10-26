/**
 * Physical and simulation constants for the Universe Simulator
 */

// Simulation settings
export const TEXTURE_SIZE = 2304 // 2304x2304 = 5,308,416 particles (5.3M)
export const PARTICLE_COUNT = TEXTURE_SIZE * TEXTURE_SIZE

// Performance settings - Fixed Sample Budget
export const SAMPLES_PER_PARTICLE = 128 // Fixed computational budget per particle
export const GRAVITY_CUTOFF_DISTANCE = 80.0 // Only check nearby particles

// Physics constants (scaled for simulation)
export const GRAVITATIONAL_CONSTANT = 0.0001 // Scaled G for visible effects
export const TIMESTEP = 0.016 // ~60fps

// Initial conditions
export const INITIAL_SPREAD = 50 // Sphere radius for initial distribution
export const INITIAL_VELOCITY_SPREAD = 0.1 // Random velocity magnitude

// Rendering - optimized for high particle count
export const PARTICLE_SIZE = 0.2
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
