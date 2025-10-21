# Galaxy Genesis - Concept Document

## Vision

Galaxy Genesis is a real-time particle-based simulation that recreates the entire lifecycle of a galaxy from cosmic dust to complex stellar systems. Unlike static visualizations or pre-rendered animations, this simulator runs actual physics calculations to demonstrate how gravity, thermodynamics, and orbital mechanics shape the universe.

The goal is to compress billions of years of cosmic evolution into minutes, allowing users to witness:
- The graceful dance of gravity pulling scattered dust into swirling clouds
- The violent compression and ignition of the first stars
- The formation of planetary systems from leftover debris
- The catastrophic death of massive stars in supernovas
- The birth of exotic objects like white dwarfs and black holes

This is educational, beautiful, and scientifically grounded—a sandbox where users can experiment with the fundamental constants of the universe.

## Core Philosophy

### Start from Nothing
The simulation begins with a field of randomly distributed dust particles with minimal initial velocities. No pre-configured solar systems, no hand-placed stars. Everything emerges from the interactions of particles following simple rules.

### Real Physics, Accelerated Time
Every interaction is governed by real physics equations:
- Newton's law of universal gravitation
- Conservation of momentum and energy
- Thermodynamic principles for heating
- Orbital mechanics

Time can be scaled from 1x (real-time) to 1,000,000x, turning billion-year processes into observable events.

### Visual Beauty
The simulation is not just scientifically accurate but visually stunning:
- Temperature-based coloring (cold dust = brown/gray, hot stars = white/blue)
- Particle trails showing movement paths
- Bloom effects on bright stars
- Accretion disks around black holes
- Nebula-like dust clouds

### Incremental Complexity
Development follows a strict incremental approach:
1. First, just render particles
2. Then add basic gravity
3. Then optimize for thousands of particles
4. Finally, add advanced stellar physics

Each step is visually testable.

## Key Features

### 1. Particle-Based Simulation

The universe is represented by 10,000-100,000 individual particles, each with:
- **Position** (x, y, z coordinates)
- **Velocity** (movement vector)
- **Mass** (from tiny dust grains to massive stars)
- **Temperature** (determines color and behavior)
- **Type** (dust, gas, proto-star, star, planet, white dwarf, black hole)

### 2. Gravitational Dynamics

Every particle attracts every other particle based on Newton's law:
```
F = G * (m1 * m2) / r²
```

To handle 10,000+ particles efficiently, we use the **Barnes-Hut algorithm**:
- Spatial subdivision using an octree
- Distant particle groups approximated as single masses
- Reduces complexity from O(n²) to O(n log n)

### 3. Compression and Heating

When particles cluster together:
- **Density increases** → gravitational compression
- **Compression generates heat** → temperature rises
- **Temperature affects color** → visual feedback
- **Critical temperature reached** → fusion ignites (star formation)

This follows the ideal gas law: `PV = nRT`

### 4. Stellar Evolution Lifecycle

Particles don't just clump—they evolve through stages:

**Stage 1: Dust Cloud**
- Low mass, low temperature
- Brown/gray color
- Gravitational collapse begins

**Stage 2: Proto-star**
- Medium mass, increasing temperature
- Orange/red color
- Fusion not yet started

**Stage 3: Main Sequence Star**
- High mass (>0.08 solar masses)
- High temperature (>10 million K core)
- White/yellow/blue color based on mass
- Stable fusion, emits light and heat

**Stage 4: Red Giant** (for massive stars)
- Fuel depleting
- Outer layers expand
- Red/orange color

**Stage 5: Death**
- **Low mass** → White Dwarf (small, hot, white)
- **High mass** → Supernova → Neutron Star or Black Hole
- Supernova ejects particles, enriching nearby dust

**Stage 6: Exotic Objects**
- **White Dwarf**: Small remnant, gradually cools
- **Black Hole**: Extreme gravity, accretion disk, no light escapes

### 5. Planetary Formation

Around stable stars:
- Leftover dust particles orbit
- Orbital velocities prevent immediate collision
- Gradual accretion forms planets
- Rocky planets (close), gas giants (far)

### 6. Collision Mechanics

When particles get too close:
- **Inelastic collision** → momentum conserved
- **Merging** → masses add, new particle formed
- **Heat generation** → collision increases temperature
- **Fragmentation** (optional) → large collisions create debris

### 7. Time Scaling

Users control the simulation speed:
- **1x**: Real-time (mostly static, for observation)
- **100x**: Slow galaxy formation
- **10,000x**: Observable star formation
- **1,000,000x**: Billion-year processes in minutes

The physics timestep remains stable using adaptive integration.

### 8. Interactive Camera

Full 3D navigation:
- **Orbit**: Rotate around the galaxy
- **Zoom**: From galaxy-wide to individual particle close-ups
- **Pan**: Move focus to different regions
- **Follow**: Lock camera to specific particle (optional)

### 9. Parameter Tweaking

Users can adjust fundamental constants:
- **Gravitational constant** (G): Affects attraction strength
- **Fusion threshold**: Mass/temperature needed for stars
- **Collision radius**: How close particles must be to merge
- **Initial particle count**: Universe density
- **Initial velocity spread**: Starting chaos level
- **Supernova mass limit**: Chandrasekhar limit (1.4 M☉)

### 10. Visual Effects

- **Temperature-based coloring**: Continuous spectrum from cold to hot
- **Particle size scaling**: Larger masses = bigger visual representation
- **Bloom/glow**: Bright stars emit light
- **Trails**: Show particle paths over time
- **Octree visualization**: Debug mode shows spatial partitioning
- **Velocity vectors**: Show movement direction

## Scientific Accuracy

While simplified for real-time performance, the simulation follows real physics:

### Accurate:
- Gravitational law (with softening parameter for stability)
- Momentum conservation
- Basic thermodynamics (compression → heating)
- Orbital mechanics
- Fusion threshold (0.08 solar masses)
- Chandrasekhar limit (1.4 solar masses)

### Simplified:
- No general relativity (uses Newtonian gravity)
- Simplified fusion model (threshold-based, not reaction network)
- No radiation pressure
- No magnetic fields
- Simplified black hole rendering
- Particle-based approximation (not continuous fluid)

The goal is to capture the essence of galaxy formation while remaining computationally feasible.

## User Experience Goals

### Educational
- Learn how gravity shapes the universe
- Understand stellar evolution
- See how small changes in constants affect outcomes
- Experiment with "what if" scenarios

### Entertaining
- Watch mesmerizing patterns emerge
- Create beautiful cosmic art
- Discover unexpected formations
- Share interesting galaxy states

### Performant
- Smooth 60 FPS even with 50,000+ particles
- Responsive controls
- Quick iteration (reset and try again)
- No loading screens

### Accessible
- Simple, uncluttered UI
- Clear visual feedback
- Intuitive controls
- Works in any modern browser

## Success Metrics

A successful implementation will:
1. ✓ Render 10,000+ particles at 60 FPS
2. ✓ Show visible clumping due to gravity within 10 seconds (at high time scale)
3. ✓ Form recognizable "star" objects (bright, hot, massive)
4. ✓ Display orbital behavior (particles circling larger masses)
5. ✓ Demonstrate temperature-based coloring (cold to hot gradient)
6. ✓ Allow smooth camera navigation
7. ✓ Respond instantly to parameter changes
8. ✓ Look visually beautiful and scientifically plausible

## Future Enhancements (Post-MVP)

Ideas for later iterations:
- **Dark matter**: Invisible particles that only interact via gravity
- **Galactic rotation**: Initial angular momentum for spiral galaxies
- **Multiple galaxies**: Simulate galaxy collisions
- **Nebulae**: Gas clouds with different properties than dust
- **Binary stars**: Two stars orbiting each other
- **VR support**: Immersive galaxy exploration
- **Particle birth**: Continuous dust generation
- **Realistic timescales**: Show age of simulation
- **Export/import**: Save and load galaxy states
- **Shader effects**: Better accretion disks, gravitational lensing

## Inspiration

This project draws inspiration from:
- **N-body simulators**: Classic gravitational simulations
- **Space Engine**: Procedural universe exploration
- **Universe Sandbox**: Interactive physics sandbox
- **Particle Life**: Emergence from simple rules
- **Real astronomy**: Hubble/JWST imagery, galaxy formation theory
