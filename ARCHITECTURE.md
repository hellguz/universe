# Technical Architecture

This document describes the technical architecture, component design, and technology choices for Galaxy Genesis.

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Component Structure](#component-structure)
4. [Data Flow](#data-flow)
5. [Performance Strategy](#performance-strategy)
6. [State Management](#state-management)
7. [File Structure](#file-structure)

---

## Technology Stack

### Core Framework
- **React 18+**: UI component library
- **Vike**: File-based routing and SSR framework (Vite-based)
- **Vite**: Build tool and dev server

### 3D Rendering
- **Three.js**: WebGL 3D library
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components (OrbitControls, Stats, etc.)

### Physics Computation
- **Web Workers**: Off-main-thread physics calculations
- **WebGL Compute Shaders** (optional): GPU-accelerated particle updates

### State Management
- **Zustand**: Lightweight state management for UI controls
- **Local state**: React hooks for component-specific state

### Styling
- **CSS Modules** or **Tailwind**: Minimal UI styling
- **Inline styles**: For dynamic/conditional styles

### Development Tools
- **TypeScript** (optional): Type safety
- **ESLint + Prettier**: Code quality
- **Yarn**: Package manager

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                   Browser Window                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              React App (Main Thread)          │  │
│  │  ┌─────────────┐         ┌─────────────────┐ │  │
│  │  │ UI Controls │────────▶│  Zustand Store  │ │  │
│  │  └─────────────┘         └─────────────────┘ │  │
│  │         │                        │            │  │
│  │         ▼                        ▼            │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │      React Three Fiber (R3F)            │ │  │
│  │  │  ┌────────────┐    ┌─────────────────┐  │ │  │
│  │  │  │   Scene    │───▶│ ParticleSystem  │  │ │  │
│  │  │  └────────────┘    └─────────────────┘  │ │  │
│  │  │  ┌────────────┐    ┌─────────────────┐  │ │  │
│  │  │  │   Camera   │    │    Lighting     │  │ │  │
│  │  │  └────────────┘    └─────────────────┘  │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────┘  │
│                        │                             │
│                        │ Particle data               │
│                        ▼                             │
│  ┌───────────────────────────────────────────────┐  │
│  │           Web Worker (Physics Thread)         │  │
│  │  ┌─────────────┐    ┌─────────────────────┐  │  │
│  │  │   Octree    │───▶│  Gravity Engine     │  │  │
│  │  └─────────────┘    └─────────────────────┘  │  │
│  │  ┌─────────────┐    ┌─────────────────────┐  │  │
│  │  │  Collision  │    │   Integration       │  │  │
│  │  └─────────────┘    └─────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Threading Model

**Main Thread**:
- React rendering
- User input handling
- UI updates
- WebGL rendering via Three.js

**Web Worker Thread**:
- Particle position/velocity updates
- Gravity calculations
- Collision detection
- Octree construction

**Communication**:
- Main → Worker: User parameters (gravity constant, time scale)
- Worker → Main: Updated particle data (positions, colors) each frame

---

## Component Structure

### React Components

```
src/
├── pages/
│   └── index.page.jsx           # Main page (Vike)
├── components/
│   ├── App.jsx                  # Root component
│   ├── Scene.jsx                # R3F Canvas wrapper
│   ├── ParticleSystem.jsx       # Particle renderer
│   ├── CameraController.jsx     # Orbit controls
│   ├── ControlPanel.jsx         # UI overlay
│   ├── StatsPanel.jsx           # FPS/particle count
│   └── Background.jsx           # Starfield background
```

### Component Hierarchy

```
<App>
  <Scene>
    <CameraController />
    <ParticleSystem />
    <Lighting />
    <Background />
  </Scene>
  <ControlPanel />
  <StatsPanel />
</App>
```

### Component Descriptions

#### `App.jsx`
- Root component
- Initializes Zustand store
- Creates and manages Web Worker
- Handles worker communication

#### `Scene.jsx`
- Wraps `<Canvas>` from R3F
- Sets up WebGL context
- Configures camera and renderer

#### `ParticleSystem.jsx`
- Receives particle data from main thread
- Renders particles using `InstancedMesh`
- Updates positions/colors each frame
- Handles particle shader materials

#### `CameraController.jsx`
- Wraps `OrbitControls` from drei
- Handles zoom, pan, rotate
- Optional: Follow mode for specific particles

#### `ControlPanel.jsx`
- UI overlay for controls
- Time scale slider
- Parameter inputs
- Pause/reset buttons

#### `StatsPanel.jsx`
- FPS counter
- Particle count
- Simulation time
- Performance metrics

---

## Data Flow

### Initialization

```
1. App mounts
2. Create Web Worker
3. Initialize particle data in worker
4. Send initial particle data to main thread
5. Create InstancedMesh in Three.js
6. Start animation loop
```

### Animation Loop

```
Main Thread:
1. Render frame with current particle data
2. Handle user input
3. Send updated parameters to worker (if changed)
4. Request next frame (requestAnimationFrame)

Web Worker:
5. Receive parameter updates
6. Rebuild octree from particle positions
7. Calculate gravitational forces
8. Update velocities and positions (Verlet)
9. Check for collisions
10. Update particle types/colors
11. Send updated particle data to main thread
```

### Data Transfer

Use **Transferable Objects** for efficient data transfer:

```javascript
// Worker → Main
const buffer = particleData.buffer;
postMessage({ particles: particleData }, [buffer]);
```

This transfers ownership instead of copying (zero-copy transfer).

---

## Performance Strategy

### GPU-Accelerated Rendering

**InstancedMesh**:
- Single draw call for all particles
- GPU-side instancing
- Update instance matrix per particle

```javascript
<instancedMesh args={[geometry, material, particleCount]}>
  <sphereGeometry args={[1, 8, 8]} />
  <meshBasicMaterial />
</instancedMesh>
```

### Level of Detail (LOD)

Adjust visual quality based on particle count:
- < 1,000 particles: High-poly spheres (16x16 segments)
- 1,000-10,000: Medium spheres (8x8 segments)
- > 10,000: Low-poly or point sprites (4x4 or billboards)

### Spatial Partitioning

**Octree** for collision detection:
- Only check particles in same octree cell
- Reduces collision checks from O(n²) to O(n)

### Frustum Culling

Only render particles visible to camera:
```javascript
// Three.js does this automatically for standard objects
// For InstancedMesh, we may need manual culling
```

### Web Worker Parallelism

Move expensive calculations off main thread:
- **Pros**: Maintains 60 FPS rendering
- **Cons**: Latency in data transfer (1-2 frames)

### Throttling Updates

For very large simulations:
- Update physics at 30 Hz
- Render at 60 Hz (interpolate positions)

---

## State Management

### Zustand Store

```javascript
// src/store/simulation.js
import create from 'zustand';

const useSimulationStore = create((set) => ({
  // Simulation state
  isRunning: false,
  timeScale: 1,
  particleCount: 10000,

  // Parameters
  gravitationalConstant: 6.674e-11,
  softeningParameter: 0.5,
  fusionThreshold: 0.08,

  // UI state
  showOctree: false,
  showTrails: false,

  // Actions
  togglePause: () => set((state) => ({ isRunning: !state.isRunning })),
  setTimeScale: (scale) => set({ timeScale: scale }),
  setParameter: (key, value) => set({ [key]: value }),
  reset: () => set({ /* reset to initial state */ }),
}));
```

### Local Component State

For ephemeral UI state (hover, focus, etc.):
```javascript
const [hoveredParticle, setHoveredParticle] = useState(null);
```

### Worker State

Physics state lives in the worker:
- Particle positions, velocities, masses
- Octree structure
- Performance counters

Main thread only receives snapshots for rendering.

---

## File Structure

```
galaxy-simulator/
├── public/                      # Static assets
│   └── favicon.ico
├── src/
│   ├── pages/
│   │   ├── index.page.jsx       # Main page
│   │   └── +config.js           # Vike config
│   ├── components/
│   │   ├── App.jsx
│   │   ├── Scene.jsx
│   │   ├── ParticleSystem.jsx
│   │   ├── CameraController.jsx
│   │   ├── ControlPanel.jsx
│   │   ├── StatsPanel.jsx
│   │   └── Background.jsx
│   ├── physics/
│   │   ├── gravity.worker.js    # Web Worker
│   │   ├── octree.js            # Octree implementation
│   │   ├── particles.js         # Particle data structures
│   │   ├── integration.js       # Verlet integrator
│   │   └── collision.js         # Collision detection
│   ├── shaders/
│   │   ├── particle.vert        # Vertex shader
│   │   ├── particle.frag        # Fragment shader
│   │   └── compute.glsl         # Compute shader (optional)
│   ├── store/
│   │   └── simulation.js        # Zustand store
│   ├── utils/
│   │   ├── constants.js         # Physical constants
│   │   └── colormap.js          # Temperature → color mapping
│   └── styles/
│       └── global.css           # Global styles
├── package.json
├── vite.config.js
├── yarn.lock
└── README.md
```

---

## Technology Choices - Rationale

### Why Vike?
- File-based routing (simple structure)
- Vite-based (fast dev server, HMR)
- Flexible (can do SSR or SPA)
- Modern alternative to Next.js/Remix

### Why React Three Fiber?
- Declarative 3D (React-style)
- Great ecosystem (drei, postprocessing)
- React integration (hooks, components)
- Better DX than vanilla Three.js

### Why Web Workers?
- Non-blocking physics calculations
- Maintains 60 FPS rendering
- Scales to 100,000+ particles
- Browser-native (no external libraries)

### Why Zustand?
- Minimal boilerplate vs Redux
- No context providers needed
- Excellent TypeScript support
- Perfect for simple global state

### Why Not Use a Physics Engine (Cannon.js, Ammo.js)?
- **Custom needs**: N-body gravity is specialized
- **Performance**: General engines are overkill
- **Learning**: Educational to implement physics
- **Control**: Can optimize for our specific use case

---

## Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| FPS | 60 | GPU rendering, Web Worker physics |
| Particle count | 10,000-50,000 | Instancing, LOD, Barnes-Hut |
| Time to first render | < 2s | Fast initial load |
| Memory usage | < 500 MB | Efficient data structures |
| Physics tick rate | 30-60 Hz | Adaptive based on performance |

---

## Scalability Considerations

### Small Simulations (< 1,000 particles)
- Brute force gravity (O(n²)) is fine
- No need for octree
- High visual quality

### Medium Simulations (1,000-10,000)
- Barnes-Hut algorithm required
- Medium visual quality
- Web Worker essential

### Large Simulations (10,000-100,000)
- Aggressive Barnes-Hut (θ = 0.8-1.0)
- Low visual quality (point sprites)
- May need GPU compute shaders
- Consider spatial hashing for collisions

---

## Browser Compatibility

### Minimum Requirements
- WebGL 2.0 support
- ES2020+ (async/await, modules)
- Web Workers
- Transferable objects

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Not Supported
- IE11 (no WebGL 2)
- Mobile browsers (performance limitations)

---

## Security & Privacy

- **No external API calls**: Runs entirely client-side
- **No user data collection**: Privacy-first
- **No server required**: Static hosting (Vercel, Netlify)

---

## Future Architecture Enhancements

- **WebGPU**: Next-gen graphics API (when widely supported)
- **SharedArrayBuffer**: For faster worker communication (requires COOP/COEP)
- **OffscreenCanvas**: Render in worker thread
- **WASM**: Rewrite physics in Rust for 2-3x speedup
- **Multi-worker**: Parallel physics across CPU cores

---

This architecture balances **simplicity**, **performance**, and **maintainability** while leaving room for future optimization.
