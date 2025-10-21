# Development Roadmap - 4-Step Incremental Plan

This document outlines the complete development plan broken into 4 testable steps. Each step builds on the previous one and can be visually verified in the browser before moving forward.

## Philosophy

- **Start Simple**: Begin with the absolute minimum
- **Test Everything**: Each step must be visually testable
- **Incremental Complexity**: Add one major feature per step
- **No Regression**: Never break what already works
- **User Feedback**: Verify in browser before proceeding

---

## Step 1: Project Setup & Basic Rendering

**Goal**: Get particles rendering on screen with basic camera controls.

**Duration**: 1-2 hours

**What You'll See**: A cloud of colored static particles that you can rotate and zoom around.

### Tasks

#### 1.1. Initialize Project

```bash
# Create project
yarn create vite galaxy-simulator --template react
cd galaxy-simulator

# Install dependencies
yarn add three @react-three/fiber @react-three/drei zustand
yarn add -D @vitejs/plugin-react

# Start dev server
yarn dev
```

#### 1.2. Project Structure

Create initial file structure:
```
src/
├── pages/
│   └── index.jsx
├── components/
│   ├── App.jsx
│   ├── Scene.jsx
│   └── ParticleSystem.jsx
├── utils/
│   └── particles.js
└── styles/
    └── global.css
```

#### 1.3. Create Particle Data (Static)

**File**: `src/utils/particles.js`

```javascript
export function createParticles(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const masses = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Random position in a sphere
    const radius = Math.random() * 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Random color (will be temperature-based later)
    colors[i * 3 + 0] = 0.5 + Math.random() * 0.5; // R
    colors[i * 3 + 1] = 0.3 + Math.random() * 0.3; // G
    colors[i * 3 + 2] = 0.2; // B

    masses[i] = Math.random() * 0.001;
  }

  return { positions, colors, masses, count };
}
```

#### 1.4. Create ParticleSystem Component

**File**: `src/components/ParticleSystem.jsx`

```javascript
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function ParticleSystem({ particles }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current || !particles) return;

    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < particles.count; i++) {
      const x = particles.positions[i * 3 + 0];
      const y = particles.positions[i * 3 + 1];
      const z = particles.positions[i * 3 + 2];

      dummy.position.set(x, y, z);
      dummy.scale.set(0.5, 0.5, 0.5);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      const color = new THREE.Color(
        particles.colors[i * 3 + 0],
        particles.colors[i * 3 + 1],
        particles.colors[i * 3 + 2]
      );
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }, [particles]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, particles.count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}
```

#### 1.5. Create Scene Component

**File**: `src/components/Scene.jsx`

```javascript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { ParticleSystem } from './ParticleSystem';

export function Scene({ particles }) {
  return (
    <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <ParticleSystem particles={particles} />
      <OrbitControls />
      <Stats />
    </Canvas>
  );
}
```

#### 1.6. Create App Component

**File**: `src/components/App.jsx`

```javascript
import { useMemo } from 'react';
import { Scene } from './Scene';
import { createParticles } from '../utils/particles';

export function App() {
  const particles = useMemo(() => createParticles(1000), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Scene particles={particles} />
    </div>
  );
}
```

#### 1.7. Main Entry Point

**File**: `src/pages/index.jsx`

```javascript
import { App } from '../components/App';

export default App;
```

#### 1.8. Add Basic Styling

**File**: `src/styles/global.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}
```

### Testing Step 1

**Run**: `yarn dev` and open browser

**✓ Expected Results**:
- See 1,000 colored spheres in a cloud formation
- FPS counter in top-left showing 60 FPS
- Mouse drag to rotate view
- Mouse scroll to zoom in/out
- Particles have varying colors (orange/red tones)

**✗ Troubleshooting**:
- Black screen? Check console for errors
- Can't rotate? Check OrbitControls import
- No particles? Check particle count and camera position

---

## Step 2: Basic Physics

**Goal**: Make particles move and attract each other with gravity.

**Duration**: 2-3 hours

**What You'll See**: Particles slowly clumping together into dense regions due to gravitational attraction.

### Tasks

#### 2.1. Add Velocity and Acceleration to Particles

**Update**: `src/utils/particles.js`

```javascript
export function createParticles(count) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3); // NEW
  const accelerations = new Float32Array(count * 3); // NEW
  const colors = new Float32Array(count * 3);
  const masses = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // ... existing position code ...

    // Small random initial velocity
    velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

    accelerations[i * 3 + 0] = 0;
    accelerations[i * 3 + 1] = 0;
    accelerations[i * 3 + 2] = 0;

    // ... existing color/mass code ...
  }

  return { positions, velocities, accelerations, colors, masses, count };
}
```

#### 2.2. Implement Simple Gravity (Brute Force)

**File**: `src/utils/gravity.js`

```javascript
export function computeGravity(particles, G = 1.0, epsilon = 0.5) {
  const count = particles.count;

  // Reset accelerations
  particles.accelerations.fill(0);

  // O(n²) brute force
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = particles.positions[j * 3 + 0] - particles.positions[i * 3 + 0];
      const dy = particles.positions[j * 3 + 1] - particles.positions[i * 3 + 1];
      const dz = particles.positions[j * 3 + 2] - particles.positions[i * 3 + 2];

      const distSq = dx * dx + dy * dy + dz * dz + epsilon * epsilon;
      const dist = Math.sqrt(distSq);
      const force = G / distSq;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;

      // Apply to i
      particles.accelerations[i * 3 + 0] += fx * particles.masses[j];
      particles.accelerations[i * 3 + 1] += fy * particles.masses[j];
      particles.accelerations[i * 3 + 2] += fz * particles.masses[j];

      // Apply to j (Newton's 3rd law)
      particles.accelerations[j * 3 + 0] -= fx * particles.masses[i];
      particles.accelerations[j * 3 + 1] -= fy * particles.masses[i];
      particles.accelerations[j * 3 + 2] -= fz * particles.masses[i];
    }
  }
}
```

#### 2.3. Implement Time Integration

**File**: `src/utils/integration.js`

```javascript
export function verletStep(particles, dt) {
  const count = particles.count;

  for (let i = 0; i < count; i++) {
    for (let axis = 0; axis < 3; axis++) {
      const idx = i * 3 + axis;

      // Update velocity (half step)
      particles.velocities[idx] += particles.accelerations[idx] * dt * 0.5;

      // Update position
      particles.positions[idx] += particles.velocities[idx] * dt;

      // Velocity will be completed after next acceleration calculation
      particles.velocities[idx] += particles.accelerations[idx] * dt * 0.5;
    }
  }
}
```

#### 2.4. Add Zustand Store for Controls

**File**: `src/store/simulation.js`

```javascript
import { create } from 'zustand';

export const useSimulationStore = create((set) => ({
  isRunning: true,
  timeScale: 1,
  G: 1.0,

  togglePause: () => set((state) => ({ isRunning: !state.isRunning })),
  setTimeScale: (scale) => set({ timeScale: scale }),
  setG: (value) => set({ G: value }),
}));
```

#### 2.5. Add Simple Control Panel

**File**: `src/components/ControlPanel.jsx`

```javascript
import { useSimulationStore } from '../store/simulation';

export function ControlPanel() {
  const { isRunning, timeScale, G, togglePause, setTimeScale, setG } = useSimulationStore();

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: 20,
      borderRadius: 8,
      minWidth: 200,
    }}>
      <h3 style={{ marginBottom: 10 }}>Controls</h3>

      <button onClick={togglePause} style={{ marginBottom: 10 }}>
        {isRunning ? 'Pause' : 'Play'}
      </button>

      <div style={{ marginBottom: 10 }}>
        <label>Time Scale: {timeScale}x</label>
        <input
          type="range"
          min="0.1"
          max="100"
          step="0.1"
          value={timeScale}
          onChange={(e) => setTimeScale(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <label>Gravity: {G.toFixed(2)}</label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={G}
          onChange={(e) => setG(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
```

#### 2.6. Update App to Run Physics

**Update**: `src/components/App.jsx`

```javascript
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Scene } from './Scene';
import { ControlPanel } from './ControlPanel';
import { createParticles } from '../utils/particles';
import { computeGravity } from '../utils/gravity';
import { verletStep } from '../utils/integration';
import { useSimulationStore } from '../store/simulation';

export function App() {
  const particles = useMemo(() => createParticles(1000), []);
  const { isRunning, timeScale, G } = useSimulationStore();

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Scene particles={particles}>
        <PhysicsLoop particles={particles} isRunning={isRunning} timeScale={timeScale} G={G} />
      </Scene>
      <ControlPanel />
    </div>
  );
}

function PhysicsLoop({ particles, isRunning, timeScale, G }) {
  useFrame(() => {
    if (!isRunning) return;

    const dt = 0.01 * timeScale;
    computeGravity(particles, G);
    verletStep(particles, dt);
  });

  return null;
}
```

#### 2.7. Update ParticleSystem to Animate

**Update**: `src/components/ParticleSystem.jsx`

Add `useFrame` to update positions:

```javascript
useFrame(() => {
  if (!meshRef.current || !particles) return;

  const mesh = meshRef.current;
  const dummy = new THREE.Object3D();

  for (let i = 0; i < particles.count; i++) {
    const x = particles.positions[i * 3 + 0];
    const y = particles.positions[i * 3 + 1];
    const z = particles.positions[i * 3 + 2];

    dummy.position.set(x, y, z);
    dummy.scale.set(0.5, 0.5, 0.5);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
});
```

### Testing Step 2

**✓ Expected Results**:
- Particles are moving
- Particles gradually cluster together
- Control panel in top-right
- Pause button works
- Time scale slider affects simulation speed
- Gravity slider changes attraction strength
- FPS should still be 60 (with 1,000 particles)

**✗ Troubleshooting**:
- Particles fly apart? G might be too high or epsilon too low
- No movement? Check if isRunning is true
- Low FPS? Reduce particle count to 500

---

## Step 3: Optimization & Octree

**Goal**: Scale to 10,000+ particles using Barnes-Hut algorithm and Web Worker.

**Duration**: 3-4 hours

**What You'll See**: Smooth 60 FPS simulation with 10,000+ particles forming complex structures.

### Tasks

#### 3.1. Implement Octree

**File**: `src/utils/octree.js`

```javascript
export class OctreeNode {
  constructor(center, size) {
    this.center = center;
    this.size = size;
    this.mass = 0;
    this.centerOfMass = [0, 0, 0];
    this.children = null;
    this.particle = -1;
  }

  isLeaf() {
    return this.children === null;
  }

  subdivide() {
    const halfSize = this.size / 2;
    const quarterSize = this.size / 4;
    this.children = [];

    for (let i = 0; i < 8; i++) {
      const offsetX = (i & 1) ? quarterSize : -quarterSize;
      const offsetY = (i & 2) ? quarterSize : -quarterSize;
      const offsetZ = (i & 4) ? quarterSize : -quarterSize;

      this.children.push(new OctreeNode(
        [
          this.center[0] + offsetX,
          this.center[1] + offsetY,
          this.center[2] + offsetZ,
        ],
        halfSize
      ));
    }
  }

  getOctant(pos) {
    let octant = 0;
    if (pos[0] > this.center[0]) octant |= 1;
    if (pos[1] > this.center[1]) octant |= 2;
    if (pos[2] > this.center[2]) octant |= 4;
    return octant;
  }
}

export class Octree {
  constructor(particles, center, size) {
    this.root = new OctreeNode(center, size);
    this.particles = particles;
    this.build();
  }

  build() {
    for (let i = 0; i < this.particles.count; i++) {
      const pos = [
        this.particles.positions[i * 3 + 0],
        this.particles.positions[i * 3 + 1],
        this.particles.positions[i * 3 + 2],
      ];
      this.insert(this.root, i, pos);
    }
    this.computeMass(this.root);
  }

  insert(node, idx, pos) {
    if (node.particle === -1 && node.isLeaf()) {
      node.particle = idx;
      return;
    }

    if (node.isLeaf()) {
      node.subdivide();
      const oldIdx = node.particle;
      const oldPos = [
        this.particles.positions[oldIdx * 3 + 0],
        this.particles.positions[oldIdx * 3 + 1],
        this.particles.positions[oldIdx * 3 + 2],
      ];
      this.insert(node.children[node.getOctant(oldPos)], oldIdx, oldPos);
      node.particle = -1;
    }

    this.insert(node.children[node.getOctant(pos)], idx, pos);
  }

  computeMass(node) {
    if (node.isLeaf()) {
      if (node.particle !== -1) {
        node.mass = this.particles.masses[node.particle];
        node.centerOfMass = [
          this.particles.positions[node.particle * 3 + 0],
          this.particles.positions[node.particle * 3 + 1],
          this.particles.positions[node.particle * 3 + 2],
        ];
      }
      return;
    }

    let totalMass = 0;
    let cm = [0, 0, 0];

    for (const child of node.children) {
      this.computeMass(child);
      totalMass += child.mass;
      cm[0] += child.centerOfMass[0] * child.mass;
      cm[1] += child.centerOfMass[1] * child.mass;
      cm[2] += child.centerOfMass[2] * child.mass;
    }

    node.mass = totalMass;
    if (totalMass > 0) {
      node.centerOfMass = [
        cm[0] / totalMass,
        cm[1] / totalMass,
        cm[2] / totalMass,
      ];
    }
  }
}
```

#### 3.2. Implement Barnes-Hut Gravity

**File**: `src/utils/barnesHut.js`

```javascript
import { Octree } from './octree';

export function computeBarnesHutGravity(particles, G = 1.0, epsilon = 0.5, theta = 0.5) {
  particles.accelerations.fill(0);

  const octree = new Octree(particles, [0, 0, 0], 200);

  for (let i = 0; i < particles.count; i++) {
    const pos = [
      particles.positions[i * 3 + 0],
      particles.positions[i * 3 + 1],
      particles.positions[i * 3 + 2],
    ];
    const acc = [0, 0, 0];
    computeNodeForce(octree.root, i, pos, acc, theta, G, epsilon);

    particles.accelerations[i * 3 + 0] = acc[0];
    particles.accelerations[i * 3 + 1] = acc[1];
    particles.accelerations[i * 3 + 2] = acc[2];
  }
}

function computeNodeForce(node, idx, pos, acc, theta, G, epsilon) {
  if (node.mass === 0) return;
  if (node.isLeaf() && node.particle === idx) return;

  const dx = node.centerOfMass[0] - pos[0];
  const dy = node.centerOfMass[1] - pos[1];
  const dz = node.centerOfMass[2] - pos[2];
  const distSq = dx * dx + dy * dy + dz * dz;
  const dist = Math.sqrt(distSq);

  const ratio = node.size / dist;

  if (node.isLeaf() || ratio < theta) {
    const force = G * node.mass / (distSq + epsilon * epsilon);
    const forceOverDist = force / dist;

    acc[0] += dx * forceOverDist;
    acc[1] += dy * forceOverDist;
    acc[2] += dz * forceOverDist;
  } else {
    for (const child of node.children) {
      computeNodeForce(child, idx, pos, acc, theta, G, epsilon);
    }
  }
}
```

#### 3.3. Create Web Worker

**File**: `src/physics/gravity.worker.js`

```javascript
import { computeBarnesHutGravity } from '../utils/barnesHut';
import { verletStep } from '../utils/integration';
import { createParticles } from '../utils/particles';

let particles = null;
let config = {
  G: 1.0,
  epsilon: 0.5,
  theta: 0.5,
  dt: 0.01,
  timeScale: 1,
};

self.onmessage = (e) => {
  switch (e.data.type) {
    case 'init':
      particles = createParticles(e.data.count);
      self.postMessage({ type: 'ready', particles: serializeParticles(particles) });
      break;

    case 'setConfig':
      config = { ...config, ...e.data.config };
      break;

    case 'step':
      if (particles) {
        computeBarnesHutGravity(particles, config.G, config.epsilon, config.theta);
        verletStep(particles, config.dt * config.timeScale);
        self.postMessage({ type: 'update', particles: serializeParticles(particles) });
      }
      break;
  }
};

function serializeParticles(p) {
  return {
    positions: p.positions,
    colors: p.colors,
    masses: p.masses,
    count: p.count,
  };
}

// Auto-step at 60 Hz
setInterval(() => {
  if (particles) {
    computeBarnesHutGravity(particles, config.G, config.epsilon, config.theta);
    verletStep(particles, config.dt * config.timeScale);
    self.postMessage({ type: 'update', particles: serializeParticles(particles) });
  }
}, 1000 / 60);
```

#### 3.4. Update App to Use Worker

**Update**: `src/components/App.jsx`

```javascript
import { useState, useEffect } from 'react';
import { Scene } from './Scene';
import { ControlPanel } from './ControlPanel';
import { useSimulationStore } from '../store/simulation';

export function App() {
  const [particles, setParticles] = useState(null);
  const { timeScale, G } = useSimulationStore();

  useEffect(() => {
    const worker = new Worker(
      new URL('../physics/gravity.worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      if (e.data.type === 'update' || e.data.type === 'ready') {
        setParticles(e.data.particles);
      }
    };

    worker.postMessage({ type: 'init', count: 10000 });

    return () => worker.terminate();
  }, []);

  useEffect(() => {
    // Send config updates to worker
    // (Implementation depends on worker setup)
  }, [timeScale, G]);

  if (!particles) return <div>Loading...</div>;

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Scene particles={particles} />
      <ControlPanel />
    </div>
  );
}
```

### Testing Step 3

**✓ Expected Results**:
- 10,000 particles rendering smoothly at 60 FPS
- Complex clustering patterns emerge
- Faster formation of dense regions
- No lag when interacting with UI
- Control panel still responsive

**✗ Troubleshooting**:
- Still slow? Check Barnes-Hut theta value (increase to 0.8)
- Worker not starting? Check browser console for errors
- Particles not updating? Verify worker message passing

---

## Step 4: Advanced Physics & Features

**Goal**: Full stellar lifecycle with temperature, collisions, star formation, and visual effects.

**Duration**: 4-6 hours

**What You'll See**: Dust particles forming hot glowing stars, collisions creating larger bodies, temperature-based colors, and eventual stellar death.

### Tasks

#### 4.1. Add Temperature and Type to Particles

**Update**: `src/utils/particles.js`

```javascript
export const ParticleType = {
  DUST: 0,
  GAS: 1,
  PROTO_STAR: 2,
  STAR: 3,
  PLANET: 4,
  WHITE_DWARF: 5,
  BLACK_HOLE: 6,
};

export function createParticles(count) {
  // ... existing arrays ...
  const temperatures = new Float32Array(count);
  const types = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    // ... existing code ...

    temperatures[i] = 10 + Math.random() * 10; // 10-20 K
    types[i] = ParticleType.DUST;
  }

  return {
    positions, velocities, accelerations,
    colors, masses, temperatures, types, count
  };
}
```

#### 4.2. Implement Compression Heating

**File**: `src/utils/heating.js`

```javascript
export function computeHeating(particles) {
  // Simple density-based heating
  const count = particles.count;

  for (let i = 0; i < count; i++) {
    // Count nearby particles (simplified)
    let nearbyCount = 0;
    const pos1 = [
      particles.positions[i * 3],
      particles.positions[i * 3 + 1],
      particles.positions[i * 3 + 2],
    ];

    for (let j = 0; j < count; j++) {
      if (i === j) continue;

      const pos2 = [
        particles.positions[j * 3],
        particles.positions[j * 3 + 1],
        particles.positions[j * 3 + 2],
      ];

      const distSq =
        Math.pow(pos2[0] - pos1[0], 2) +
        Math.pow(pos2[1] - pos1[1], 2) +
        Math.pow(pos2[2] - pos1[2], 2);

      if (distSq < 4) { // Within radius 2
        nearbyCount++;
      }
    }

    // Temperature increases with density
    const densityFactor = nearbyCount * 0.01;
    particles.temperatures[i] += densityFactor;

    // Cooling (radiation)
    particles.temperatures[i] *= 0.999;
  }
}
```

#### 4.3. Implement Stellar Evolution

**File**: `src/utils/stellar.js`

```javascript
import { ParticleType } from './particles';

const FUSION_MASS = 0.08; // Solar masses
const FUSION_TEMP = 10000; // Kelvin

export function updateStellarTypes(particles) {
  for (let i = 0; i < particles.count; i++) {
    const mass = particles.masses[i];
    const temp = particles.temperatures[i];

    if (mass > FUSION_MASS && temp > FUSION_TEMP) {
      particles.types[i] = ParticleType.STAR;
    } else if (mass > 0.01 && temp > 1000) {
      particles.types[i] = ParticleType.PROTO_STAR;
    } else if (mass > 0.001) {
      particles.types[i] = ParticleType.GAS;
    } else {
      particles.types[i] = ParticleType.DUST;
    }
  }
}
```

#### 4.4. Implement Temperature-Based Coloring

**File**: `src/utils/colormap.js`

```javascript
export function updateColors(particles) {
  for (let i = 0; i < particles.count; i++) {
    const temp = particles.temperatures[i];
    const color = temperatureToColor(temp);

    particles.colors[i * 3 + 0] = color[0];
    particles.colors[i * 3 + 1] = color[1];
    particles.colors[i * 3 + 2] = color[2];
  }
}

function temperatureToColor(temp) {
  if (temp < 100) {
    // Cold: dark brown/gray
    return [0.3, 0.2, 0.15];
  } else if (temp < 1000) {
    // Warm: brown/orange
    const t = (temp - 100) / 900;
    return [0.6 + t * 0.4, 0.3 + t * 0.3, 0.1];
  } else if (temp < 5000) {
    // Hot: orange/yellow
    const t = (temp - 1000) / 4000;
    return [1.0, 0.6 + t * 0.4, t * 0.3];
  } else if (temp < 10000) {
    // Very hot: yellow/white
    const t = (temp - 5000) / 5000;
    return [1.0, 1.0, 0.5 + t * 0.5];
  } else {
    // Fusion: white/blue
    const t = Math.min((temp - 10000) / 40000, 1);
    return [1.0 - t * 0.2, 1.0 - t * 0.1, 1.0];
  }
}
```

#### 4.5. Implement Collision Detection & Merging

**File**: `src/utils/collision.js`

```javascript
export function handleCollisions(particles, threshold = 0.5) {
  const toRemove = new Set();

  for (let i = 0; i < particles.count; i++) {
    if (toRemove.has(i)) continue;

    for (let j = i + 1; j < particles.count; j++) {
      if (toRemove.has(j)) continue;

      const dx = particles.positions[j * 3] - particles.positions[i * 3];
      const dy = particles.positions[j * 3 + 1] - particles.positions[i * 3 + 1];
      const dz = particles.positions[j * 3 + 2] - particles.positions[i * 3 + 2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < threshold * threshold) {
        // Merge j into i
        mergeParticles(particles, i, j);
        toRemove.add(j);
      }
    }
  }

  // Remove merged particles
  if (toRemove.size > 0) {
    removeParticles(particles, toRemove);
  }
}

function mergeParticles(particles, i, j) {
  const m1 = particles.masses[i];
  const m2 = particles.masses[j];
  const totalMass = m1 + m2;

  // Momentum conservation
  for (let k = 0; k < 3; k++) {
    particles.velocities[i * 3 + k] =
      (m1 * particles.velocities[i * 3 + k] + m2 * particles.velocities[j * 3 + k]) / totalMass;
    particles.positions[i * 3 + k] =
      (m1 * particles.positions[i * 3 + k] + m2 * particles.positions[j * 3 + k]) / totalMass;
  }

  particles.masses[i] = totalMass;

  // Heat from collision
  const relVelSq =
    Math.pow(particles.velocities[i * 3] - particles.velocities[j * 3], 2) +
    Math.pow(particles.velocities[i * 3 + 1] - particles.velocities[j * 3 + 1], 2) +
    Math.pow(particles.velocities[i * 3 + 2] - particles.velocities[j * 3 + 2], 2);

  particles.temperatures[i] += relVelSq * 10;
}

function removeParticles(particles, indices) {
  // Implementation: shift arrays to remove particles
  // (Simplified - in production, use more efficient method)
}
```

#### 4.6. Update Worker with All Physics

**Update**: `src/physics/gravity.worker.js`

```javascript
import { computeBarnesHutGravity } from '../utils/barnesHut';
import { verletStep } from '../utils/integration';
import { computeHeating } from '../utils/heating';
import { updateStellarTypes } from '../utils/stellar';
import { updateColors } from '../utils/colormap';
import { handleCollisions } from '../utils/collision';
import { createParticles } from '../utils/particles';

// ... existing code ...

function physicsStep() {
  computeBarnesHutGravity(particles, config.G, config.epsilon, config.theta);
  verletStep(particles, config.dt * config.timeScale);
  computeHeating(particles);
  updateStellarTypes(particles);
  handleCollisions(particles, 0.5);
  updateColors(particles);
}
```

#### 4.7. Enhanced UI with All Controls

**Update**: `src/components/ControlPanel.jsx`

Add all parameter controls:
- Fusion threshold slider
- Collision radius slider
- Heating rate slider
- Particle type visualization toggle
- Reset button

#### 4.8. Add Particle Scaling Based on Mass

**Update**: `src/components/ParticleSystem.jsx`

```javascript
// In the update loop
const scale = Math.cbrt(particles.masses[i]) * 0.5;
dummy.scale.set(scale, scale, scale);
```

### Testing Step 4

**✓ Expected Results**:
- Dust particles (brown/gray) start scattered
- Particles clump and turn orange (heating)
- Dense clumps turn yellow then white (proto-stars)
- Bright white/blue stars form in densest regions
- Collisions merge particles into larger bodies
- Temperature-based coloring throughout
- Realistic galaxy formation over time

**✗ Troubleshooting**:
- No color change? Check colormap function
- No stars forming? Lower fusion threshold
- Too many collisions? Increase collision radius
- Performance issues? Optimize collision detection

---

## Summary

By the end of Step 4, you'll have:

✅ **10,000+ particle simulation** at 60 FPS
✅ **Real physics**: Gravity, heating, collisions
✅ **Stellar evolution**: Dust → stars → death
✅ **Beautiful visuals**: Temperature-based colors
✅ **Interactive controls**: Tweak all parameters
✅ **Fully functional galaxy simulator**

## Next Steps (Optional Enhancements)

After completing all 4 steps, consider adding:
- Trails/motion blur
- Supernova explosions
- Black hole accretion disks
- Spiral galaxy initial conditions
- Save/load simulation states
- Better performance monitoring
- Advanced shader effects
