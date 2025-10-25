# Universe Simulator

A full-featured, particle-based universe simulator that visualizes cosmic evolution from the Big Bang to the present day. Watch galaxies form, stars ignite, and planets orbit in real-time with accurate physics and stunning visual effects.

## Vision

Create an immersive, interactive experience that allows users to:
- Witness the evolution of the universe from the Big Bang through billions of years
- Observe realistic galaxy formation, stellar ignition, and planetary dynamics
- Experience cosmic events including supernovae, black hole formations, and cosmic microwave background radiation
- Manipulate fundamental variables (time scale, mass distribution, spatial dimensions) to explore different evolutionary paths
- Interact with millions of particles running smoothly at 60fps on both desktop and mobile devices

## Core Requirements

### Simulation Features

#### Cosmic Evolution
- **Big Bang Origin**: Initial conditions based on inflationary cosmology
- **Universe Expansion**: Cosmological expansion with configurable Hubble parameter
- **Dark Matter Distribution**: Invisible mass scaffolding for structure formation
- **Cosmic Microwave Background**: Visual representation of early universe radiation

#### Structure Formation
- **Galaxy Formation**: From primordial density fluctuations to spiral/elliptical galaxies
- **Star Clusters**: Globular and open cluster formation
- **Galactic Dynamics**: Rotation curves, spiral arms, galactic collisions
- **Large-Scale Structure**: Cosmic web, filaments, and voids

#### Stellar Physics
- **Star Formation**: Collapse of gas clouds into protostars
- **Main Sequence Evolution**: Color and luminosity based on mass
- **Stellar Classification**: O, B, A, F, G, K, M spectral types
- **Stellar Death**:
  - Planetary nebulae from low-mass stars
  - Supernovae (Type Ia, Type II)
  - Neutron stars and pulsars
  - Black hole formation and accretion

#### Planetary Systems
- **Planet Formation**: Protoplanetary disk evolution
- **Orbital Mechanics**: Keplerian orbits with perturbations
- **Multiple Star Systems**: Binary, trinary stellar configurations
- **Exoplanet Diversity**: Rocky, gas giant, ice giant classifications

#### Cosmic Events
- **Supernovae**: Core-collapse and thermonuclear explosions
- **Gamma-Ray Bursts**: From massive star collapse
- **Black Hole Mergers**: Gravitational wave events
- **Neutron Star Collisions**: Kilonova events
- **Active Galactic Nuclei**: Quasar and blazar activity

### Interactive Controls

#### Time Manipulation
- **Time Scale Control**: From real-time to billions of years per second
- **Pause/Resume**: Freeze simulation state
- **Timeline Markers**: Jump to significant cosmic epochs
- **Playback Speed**: Variable time dilation (1x to 1,000,000x)

#### Physical Parameters
- **Initial Conditions**:
  - Particle count (100K - 5M)
  - Initial density distribution
  - Temperature and energy
- **Universal Constants**:
  - Gravitational constant
  - Dark matter ratio
  - Dark energy/cosmological constant
  - Expansion rate
- **Local Parameters**:
  - Star formation rate
  - Supernova frequency
  - Black hole mass thresholds

#### Spatial Controls
- **Camera Movement**:
  - Free-fly navigation
  - Orbit selected objects
  - Follow particle trajectories
- **Zoom Levels**: From cosmic scale (Gpc) to stellar systems (AU)
- **Coordinate Systems**: Comoving vs physical coordinates

### Visual Representation

#### Rendering
- **Particle System**: WebGL-based with shader-driven effects
- **Color Coding**:
  - Temperature (blue = hot, red = cool for stars)
  - Density (for gas/dark matter)
  - Velocity (Doppler shift visualization)
  - Age (temporal evolution)
- **Glow Effects**: Bloom for bright objects (stars, AGN)
- **Trails**: Particle path history (optional)
- **Adaptive Detail**: LOD based on zoom level

#### Visual Effects
- **Supernova Explosions**: Expanding shockwaves with particle ejection
- **Black Hole Accretion**: Accretion disk with gravitational lensing effect
- **Nebulae**: Gas cloud visualization with emission colors
- **Cosmic Web**: Dark matter filament highlighting
- **Galaxy Arms**: Spiral density wave patterns

#### UI Design
- **Aesthetic**: Minimalist white-on-black interface
- **Control Panel**: Clean, collapsible sidebar with grouped controls
- **HUD**: Time elapsed, particle count, simulation stats
- **Tooltips**: Contextual help on hover
- **Responsive**: Adapts to mobile and desktop screens

## Technical Stack

### Core Technologies
- **React**: ^18.x - Component architecture
- **React Three Fiber**: ^8.x - React renderer for Three.js
- **Three.js**: ^0.160+ - WebGL 3D engine
- **TypeScript**: ^5.x - Type safety
- **Vite**: ^5.x - Build tool and dev server
- **Yarn**: Package management

### Additional Libraries
- **@react-three/drei**: Helpers and abstractions for R3F
- **@react-three/postprocessing**: Visual effects (bloom, etc.)
- **zustand**: Lightweight state management
- **leva**: GUI controls for debugging
- **glsl-noise**: Shader noise functions
- **stats.js**: Performance monitoring

## Performance Targets

### Primary Goals
- **Particle Count**: 5,000,000 particles (desktop), 500,000 (mobile)
- **Frame Rate**: Consistent 60 FPS
- **Startup Time**: < 3 seconds to first interactive frame
- **Memory Usage**: < 2GB on desktop, < 512MB on mobile

### Optimization Strategies
- **Frame Buffer Objects (FBO)**: GPU-based particle simulation
- **Instanced Rendering**: Efficient particle rendering
- **Compute Shaders**: Parallel physics calculations
- **Spatial Partitioning**: Octree/Barnes-Hut for gravity
- **Level of Detail**: Reduce particle detail at distance
- **Frustum Culling**: Only render visible particles
- **Texture Atlases**: Minimize texture switches

## Architecture

### Particle System Design

The simulation uses a dual-pass rendering architecture leveraging Frame Buffer Objects (FBO) to achieve extreme performance with millions of particles.

#### 1. Simulation Pass (Physics)
```
Data Textures (RGBA Float32) → Fragment Shader → Updated State → Render Target
```

**Input Data Textures**:
- Position Texture (x, y, z, mass)
- Velocity Texture (vx, vy, vz, temperature)
- Metadata Texture (type, age, state, energy)

**Fragment Shader Calculations**:
- Gravitational force computation (Barnes-Hut approximation)
- Velocity integration (Verlet/RK4)
- Collision detection and response
- State transitions (e.g., gas → star, star → supernova)
- Temperature and energy updates

**Output**: Updated textures written to WebGLRenderTarget

#### 2. Render Pass (Visualization)
```
Render Target Textures → Vertex Shader → Fragment Shader → Screen
```

**Vertex Shader**:
- Read position from FBO texture
- Calculate particle size based on type/distance
- Apply camera transformations
- Set gl_Position and gl_PointSize

**Fragment Shader**:
- Sample particle type and state
- Apply color based on temperature/type
- Create glow effect (radial gradient)
- Blend mode for luminous effects

### Physics Model (Simplified)

#### Gravitational Interactions
**Barnes-Hut Algorithm** (O(N log N) complexity):
1. Build octree spatial partition each frame
2. Group distant particles into nodes with center of mass
3. For each particle:
   - Traverse octree
   - Use node COM if θ = s/d < 0.5 (s=node size, d=distance)
   - Use direct calculation for nearby particles
4. Accumulate forces and update velocities

#### Cosmological Expansion
- Hubble flow: `v_recession = H₀ × distance`
- Implemented as velocity offset in simulation pass
- Configurable expansion rate

#### Stellar Evolution (State Machine)
States: Gas Cloud → Protostar → Main Sequence → Red Giant → End State
- **Gas Cloud**: Low temperature, collapsing if density threshold met
- **Protostar**: Heating phase, fusion begins at T > 10⁷K
- **Main Sequence**: Stable fusion, lifetime ∝ M⁻²·⁵
- **Red Giant**: Expanded radius, cooler surface temp
- **End States**:
  - M < 8 M☉: Planetary Nebula → White Dwarf
  - M > 8 M☉: Supernova → Neutron Star or Black Hole

#### Particle Types
1. **Dark Matter** (60% of particles)
   - Only gravitational interaction
   - Invisible (rendered as subtle glow in debug mode)

2. **Gas** (35% of particles)
   - Collision and pressure forces
   - Can form stars when dense
   - Color coded by temperature

3. **Stars** (4% of particles)
   - Point masses with luminosity
   - Color based on spectral class
   - State evolution over time

4. **Compact Objects** (1% of particles)
   - White dwarfs, neutron stars, black holes
   - Special rendering (accretion disks, lensing)

### Data Flow

```
User Input → State Manager (Zustand)
                ↓
    Simulation Parameters (Uniforms)
                ↓
    ┌───────────────────────────┐
    │   Simulation Material     │
    │  (Fragment Shader on GPU) │
    │                           │
    │  - Barnes-Hut Gravity     │
    │  - Velocity Integration   │
    │  - State Transitions      │
    │  - Temperature Updates    │
    └───────────┬───────────────┘
                ↓
    WebGLRenderTarget (FBO)
    - Position Texture
    - Velocity Texture
    - Metadata Texture
                ↓
    ┌───────────────────────────┐
    │    Render Material        │
    │ (Vertex + Fragment Shader)│
    │                           │
    │  - Position Lookup        │
    │  - Particle Visualization │
    │  - Color/Size Mapping     │
    └───────────┬───────────────┘
                ↓
         Screen Output (60 FPS)
```

### Project Structure

```
universe-simulator/
├── public/
│   └── assets/
│       └── textures/          # Any static textures
├── src/
│   ├── components/
│   │   ├── Scene.tsx          # Main R3F Canvas
│   │   ├── Camera.tsx         # Camera controls
│   │   ├── ParticleSystem.tsx # Main particle renderer
│   │   ├── ControlPanel.tsx   # UI controls
│   │   └── HUD.tsx            # Stats overlay
│   ├── simulation/
│   │   ├── FBO.tsx            # Frame Buffer Object setup
│   │   ├── SimulationMaterial.ts # Physics shader material
│   │   ├── RenderMaterial.ts  # Visual shader material
│   │   └── initialConditions.ts # Universe setup
│   ├── physics/
│   │   ├── barnesHut.ts       # Octree implementation
│   │   ├── gravity.worker.ts  # Web Worker for CPU fallback
│   │   ├── stellarEvolution.ts # Star lifecycle logic
│   │   └── cosmology.ts       # Expansion, CMB, etc.
│   ├── shaders/
│   │   ├── simulation/
│   │   │   ├── vertex.glsl
│   │   │   └── fragment.glsl  # Main physics calculations
│   │   └── render/
│   │       ├── vertex.glsl    # Particle positioning
│   │       └── fragment.glsl  # Particle appearance
│   ├── store/
│   │   └── simulationStore.ts # Zustand state
│   ├── utils/
│   │   ├── dataTexture.ts     # FBO texture helpers
│   │   ├── colorMaps.ts       # Temperature → Color
│   │   └── constants.ts       # Physical constants
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Phased Development Roadmap

### Phase 1: MVP - Basic Particle System (2-3 weeks)

**Goal**: Functional particle simulator with gravity and basic controls

#### Features
- [x] Project setup (Vite + React + TypeScript + R3F)
- [ ] Basic FBO implementation with simulation/render passes
- [ ] Simple gravitational simulation (direct N-body, limited particles)
- [ ] Initial particle distribution (random sphere)
- [ ] Basic camera controls (orbit, zoom, pan)
- [ ] Time control (play, pause, speed adjustment)
- [ ] Simple particle rendering (single color, size based on distance)
- [ ] Basic UI (minimal controls, stats display)
- [ ] Performance monitoring (FPS counter)

#### Technical Milestones
1. **FBO Setup**: 128×128 texture (16,384 particles) running at 60fps
2. **Gravity Working**: Particles attract each other visibly
3. **Smooth Controls**: Camera and time manipulation responsive
4. **Clean UI**: White-on-black minimal interface

#### Success Criteria
- 16K particles @ 60fps on mid-range hardware
- Visible gravitational clustering
- Intuitive camera navigation
- Time speed adjustable from 1x to 1000x

---

### Phase 2: Galaxy Formation & Optimization (3-4 weeks)

**Goal**: Realistic galaxy structures with improved performance

#### Features
- [ ] Barnes-Hut octree gravity implementation
- [ ] Scale to 1M+ particles with FBO optimization
- [ ] Initial conditions for disk/spiral galaxy formation
- [ ] Particle types: Dark matter, gas, stars
- [ ] Temperature-based color coding
- [ ] Particle state system (gas → star transitions)
- [ ] Rotation and angular momentum conservation
- [ ] Galaxy collision scenarios
- [ ] Improved visual effects (glow, bloom)
- [ ] Performance profiling and optimization

#### Technical Milestones
1. **Barnes-Hut Integration**: Octree built and traversed in fragment shader
2. **1M Particles**: Smooth 60fps with full physics
3. **Galaxy Morphology**: Recognizable spiral arms forming
4. **Shader Optimization**: Minimize texture lookups, optimize math

#### Success Criteria
- 1M particles @ 60fps on desktop
- Clear spiral galaxy formation within 30s sim time
- Visually distinct particle types
- < 5% frame time variance

---

### Phase 3: Stellar Evolution & Cosmic Events (3-4 weeks)

**Goal**: Realistic stellar lifecycle and spectacular events

#### Features
- [ ] Star formation from dense gas regions
- [ ] Spectral class system (O/B/A/F/G/K/M)
- [ ] Main sequence evolution timescales
- [ ] Red giant expansion
- [ ] Supernova explosions with particle ejection
- [ ] Compact object formation (WD, NS, BH)
- [ ] Black hole accretion disk visualization
- [ ] Gravitational lensing effects (simplified)
- [ ] Planetary nebulae rendering
- [ ] Cosmic microwave background visualization
- [ ] Enhanced control panel with event triggers
- [ ] Timeline system with cosmic epochs

#### Technical Milestones
1. **State Machine**: Stellar lifecycle states working correctly
2. **Supernova Effects**: Explosive particle emission implemented
3. **Visual Polish**: Accretion disks, lensing, nebulae rendered
4. **Event System**: Triggered cosmic events functional

#### Success Criteria
- Stars visibly forming, evolving, and dying
- Supernova creates visible shockwave
- Black holes render with accretion effects
- Timeline allows jumping to key moments

---

### Phase 4: Advanced Features & Mobile Support (2-3 weeks)

**Goal**: Production-ready with cross-platform support

#### Features
- [ ] Mobile optimization (reduced particle count, simplified shaders)
- [ ] Responsive UI for touch devices
- [ ] Save/load simulation states
- [ ] Screenshot and video export
- [ ] Preset scenarios (Big Bang, galaxy collision, etc.)
- [ ] Parameter presets (different universe constants)
- [ ] Advanced camera modes (follow particle, tour mode)
- [ ] Keyboard shortcuts
- [ ] Help system/tutorial
- [ ] Performance adaptive quality
- [ ] PWA support for offline use
- [ ] Analytics and error tracking

#### Technical Milestones
1. **Mobile Build**: 500K particles @ 30fps on mobile
2. **Feature Complete**: All core requirements implemented
3. **Polish Pass**: UI/UX refined, animations smooth
4. **Testing**: Cross-browser, cross-device validation

#### Success Criteria
- Works on iPhone/Android with acceptable performance
- All features accessible on mobile
- Preset scenarios demonstrate full capability
- Production build < 5MB initial load

---

### Phase 5: Polish & Extension (Ongoing)

**Optional enhancements for future iterations**:

- [ ] Planetary system detail (zoom to see individual planets)
- [ ] Multiplayer observation (share simulation state)
- [ ] VR support for immersive experience
- [ ] Scientific data export (CSV, JSON)
- [ ] Integration with real astronomical data
- [ ] Advanced cosmology (dark energy equation of state)
- [ ] GPU compute shader acceleration (WebGPU)
- [ ] Machine learning for structure formation prediction
- [ ] Sound design (sonification of cosmic events)

## Development Setup

### Prerequisites
- Node.js 18+
- Yarn 1.22+
- Modern GPU with WebGL 2.0 support
- 8GB+ RAM recommended

### Installation

```bash
# Clone repository
git clone <repository-url>
cd universe-simulator

# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Start production build
yarn start
```

### Environment Configuration

Create `.env` file for configuration:

```env
# Development
VITE_MAX_PARTICLES=5000000
VITE_DEFAULT_PARTICLES=1000000
VITE_ENABLE_STATS=true
VITE_DEBUG_MODE=false

# Physics
VITE_GRAVITATIONAL_CONSTANT=6.674e-11
VITE_TIMESTEP=0.016
VITE_HUBBLE_CONSTANT=70

# Rendering
VITE_BLOOM_STRENGTH=1.5
VITE_PARTICLE_SIZE=2.0
```

### Development Commands

```bash
yarn dev           # Start dev server (localhost:5173)
yarn build         # Production build
yarn start         # Preview production build
yarn lint          # Run ESLint
yarn ts            # TypeScript validation
yarn test          # Run tests (Vitest)
```

## Key Technical Challenges

### 1. Particle Count vs Performance
**Challenge**: Simulating 5M particles with complex physics at 60fps

**Solution**:
- FBO technique offloads all physics to GPU fragment shaders
- Barnes-Hut reduces gravity complexity from O(N²) to O(N log N)
- Instanced rendering for particle visualization
- Adaptive quality based on performance monitoring

### 2. Accurate Physics at Scale
**Challenge**: Balancing realism with computational feasibility

**Solution**:
- Use simplified but physically-motivated models
- Barnes-Hut approximation for distant particles
- Stellar evolution as discrete state machine vs continuous simulation
- Cosmological expansion as velocity field vs full GR

### 3. Visual Clarity
**Challenge**: Making millions of particles comprehensible

**Solution**:
- Color coding by temperature, type, age
- Adaptive particle size (larger when important/close)
- Bloom effects for luminous objects
- Optional trails and highlighting
- Adjustable density/opacity

### 4. Mobile Performance
**Challenge**: Limited GPU/memory on mobile devices

**Solution**:
- Reduced particle count (500K vs 5M)
- Simplified shaders (fewer texture lookups)
- Lower resolution render targets
- Disable expensive effects (bloom, trails)
- Progressive loading

### 5. State Management
**Challenge**: Coordinating complex simulation state across components

**Solution**:
- Zustand for centralized state
- Immutable updates for time-travel debugging
- Derived state for computed values
- Separation of simulation and UI state

## Performance Benchmarks

Target performance across hardware tiers:

| Hardware Tier     | Particle Count | Frame Rate | Settings               |
| ----------------- | -------------- | ---------- | ---------------------- |
| High-end Desktop  | 5,000,000      | 60 FPS     | Full effects, 4K       |
| Mid-range Desktop | 2,000,000      | 60 FPS     | Full effects, 1080p    |
| Budget Desktop    | 500,000        | 60 FPS     | Reduced effects, 1080p |
| High-end Mobile   | 500,000        | 30-60 FPS  | Reduced effects, 720p  |
| Mid-range Mobile  | 250,000        | 30 FPS     | Minimal effects, 720p  |

### Optimization Checklist
- [ ] Use `Float32Array` for all data textures
- [ ] Minimize texture reads in shaders (cache in variables)
- [ ] Use `THREE.AdditiveBlending` for particle blending
- [ ] Set `depthWrite: false` on particle materials
- [ ] Implement frustum culling for distant particle groups
- [ ] Use `THREE.InstancedBufferGeometry` if not using points
- [ ] Profile with Chrome DevTools → Performance tab
- [ ] Monitor memory with `stats.js` and `renderer.info`
- [ ] Use `THREE.WebGLRenderer` with `antialias: false` for performance
- [ ] Dispose of unused geometries/materials/textures

## Resources & References

### Articles & Tutorials
- [The magical world of Particles with React Three Fiber and Shaders](https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/) - FBO technique
- [The Study of Shaders with React Three Fiber](https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/) - Shader fundamentals
- [Three.js Journey](https://threejs-journey.com/) - Three.js course
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/) - R3F docs

### Scientific Background
- [Illustris Simulation](https://www.illustris-project.org/) - Cosmological simulation reference
- [ΛCDM Model](https://en.wikipedia.org/wiki/Lambda-CDM_model) - Standard cosmology
- [Barnes-Hut Algorithm](https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation) - N-body optimization
- [Stellar Evolution](https://en.wikipedia.org/wiki/Stellar_evolution) - Star lifecycle

### Libraries & Tools
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [Three.js](https://threejs.org/)
- [Drei](https://github.com/pmndrs/drei) - R3F helpers
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Leva](https://github.com/pmndrs/leva) - GUI controls
- [glslify](https://github.com/glslify/glslify) - GLSL module system

### Inspiration
- [WebGL Galaxy Simulation](https://experiments.withgoogle.com/chrome/galaxy)
- [Cosmic Web Simulation](https://wwwmpa.mpa-garching.mpg.de/galform/virgo/millennium/)
- [Space Engine](http://spaceengine.org/) - Universe simulator (desktop)

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## Author

Created as a learning project to explore:
- Advanced particle systems with React Three Fiber
- GPU-accelerated physics simulation
- Frame Buffer Object techniques
- Astrophysical visualization

---

**Note**: This is an ambitious project. The roadmap is designed to be iterative - each phase builds on the previous one. Don't expect to implement everything at once. Focus on getting each phase working well before moving to the next.

The MVP (Phase 1) alone is a significant achievement and demonstrates the core concepts. Phases 2-4 add realism and features. Treat Phase 5 as long-term goals.

**Start simple. Iterate. Optimize. Make it beautiful.** ✨
