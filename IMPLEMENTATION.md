# Implementation Details

This document provides concrete implementation details, data structures, algorithms, and code patterns for Galaxy Genesis.

## Table of Contents
1. [Particle Data Structure](#particle-data-structure)
2. [Octree Implementation](#octree-implementation)
3. [Barnes-Hut Algorithm](#barnes-hut-algorithm)
4. [Rendering with InstancedMesh](#rendering-with-instancedmesh)
5. [Web Worker Communication](#web-worker-communication)
6. [Shader Programs](#shader-programs)
7. [Collision Detection](#collision-detection)
8. [Temperature-Based Coloring](#temperature-based-coloring)
9. [Time Integration](#time-integration)
10. [Constants and Configuration](#constants-and-configuration)

---

## Particle Data Structure

### Memory Layout

For efficient GPU transfer and cache locality, use **Structure of Arrays (SoA)** instead of Array of Structures (AoS).

**Bad (AoS)**:
```javascript
const particles = [
  { x: 1, y: 2, z: 3, vx: 0, vy: 0, vz: 0, mass: 1.0, ... },
  { x: 4, y: 5, z: 6, vx: 0, vy: 0, vz: 0, mass: 1.5, ... },
  // ...
];
```

**Good (SoA)**:
```javascript
const particles = {
  position: new Float32Array(count * 3),  // [x0, y0, z0, x1, y1, z1, ...]
  velocity: new Float32Array(count * 3),  // [vx0, vy0, vz0, vx1, vy1, vz1, ...]
  acceleration: new Float32Array(count * 3),
  mass: new Float32Array(count),          // [m0, m1, m2, ...]
  temperature: new Float32Array(count),   // [T0, T1, T2, ...]
  type: new Uint8Array(count),            // [type0, type1, ...]
  color: new Float32Array(count * 3),     // [r0, g0, b0, r1, g1, b1, ...]
};
```

**Benefits**:
- Better cache locality during physics calculations
- Easy to transfer to GPU
- SIMD optimization potential

### Particle Types

```javascript
const ParticleType = {
  DUST: 0,
  GAS: 1,
  PROTO_STAR: 2,
  STAR: 3,
  PLANET: 4,
  WHITE_DWARF: 5,
  BLACK_HOLE: 6,
};
```

### Initialization

```javascript
function createParticles(count) {
  const particles = {
    position: new Float32Array(count * 3),
    velocity: new Float32Array(count * 3),
    acceleration: new Float32Array(count * 3),
    mass: new Float32Array(count),
    temperature: new Float32Array(count),
    type: new Uint8Array(count),
    color: new Float32Array(count * 3),
  };

  for (let i = 0; i < count; i++) {
    // Random position in a sphere
    const radius = Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    particles.position[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    particles.position[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particles.position[i * 3 + 2] = radius * Math.cos(phi);

    // Small random velocity
    particles.velocity[i * 3 + 0] = (Math.random() - 0.5) * 0.1;
    particles.velocity[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    particles.velocity[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

    // Initial mass (small, dust-like)
    particles.mass[i] = Math.random() * 0.001 + 0.0001;

    // Initial temperature (cold)
    particles.temperature[i] = 10; // 10 K

    // All start as dust
    particles.type[i] = ParticleType.DUST;
  }

  return particles;
}
```

---

## Octree Implementation

### Node Structure

```javascript
class OctreeNode {
  constructor(center, size) {
    this.center = center;       // [x, y, z]
    this.size = size;           // width of cube
    this.mass = 0;              // total mass in this node
    this.centerOfMass = [0, 0, 0];
    this.children = null;       // array of 8 child nodes (or null)
    this.particle = -1;         // particle index (if leaf)
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

      const childCenter = [
        this.center[0] + offsetX,
        this.center[1] + offsetY,
        this.center[2] + offsetZ,
      ];

      this.children.push(new OctreeNode(childCenter, halfSize));
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
```

### Octree Construction

```javascript
class Octree {
  constructor(particles, center, size) {
    this.root = new OctreeNode(center, size);
    this.particles = particles;
    this.build();
  }

  build() {
    const count = this.particles.mass.length;
    for (let i = 0; i < count; i++) {
      const pos = [
        this.particles.position[i * 3 + 0],
        this.particles.position[i * 3 + 1],
        this.particles.position[i * 3 + 2],
      ];
      this.insert(this.root, i, pos);
    }
    this.computeMassDistribution(this.root);
  }

  insert(node, particleIndex, pos) {
    // If node is empty, place particle here
    if (node.particle === -1 && node.isLeaf()) {
      node.particle = particleIndex;
      return;
    }

    // If node contains a particle, subdivide
    if (node.isLeaf()) {
      node.subdivide();
      const oldParticle = node.particle;
      const oldPos = [
        this.particles.position[oldParticle * 3 + 0],
        this.particles.position[oldParticle * 3 + 1],
        this.particles.position[oldParticle * 3 + 2],
      ];
      const oldOctant = node.getOctant(oldPos);
      this.insert(node.children[oldOctant], oldParticle, oldPos);
      node.particle = -1;
    }

    // Insert into appropriate child
    const octant = node.getOctant(pos);
    this.insert(node.children[octant], particleIndex, pos);
  }

  computeMassDistribution(node) {
    if (node.isLeaf()) {
      if (node.particle !== -1) {
        node.mass = this.particles.mass[node.particle];
        node.centerOfMass = [
          this.particles.position[node.particle * 3 + 0],
          this.particles.position[node.particle * 3 + 1],
          this.particles.position[node.particle * 3 + 2],
        ];
      }
      return;
    }

    let totalMass = 0;
    let cmx = 0, cmy = 0, cmz = 0;

    for (const child of node.children) {
      this.computeMassDistribution(child);
      totalMass += child.mass;
      cmx += child.centerOfMass[0] * child.mass;
      cmy += child.centerOfMass[1] * child.mass;
      cmz += child.centerOfMass[2] * child.mass;
    }

    node.mass = totalMass;
    if (totalMass > 0) {
      node.centerOfMass = [cmx / totalMass, cmy / totalMass, cmz / totalMass];
    }
  }
}
```

---

## Barnes-Hut Algorithm

### Force Calculation

```javascript
function computeBarnesHutForce(particles, octree, theta = 0.5, G = 1.0, epsilon = 0.5) {
  const count = particles.mass.length;

  // Reset accelerations
  particles.acceleration.fill(0);

  for (let i = 0; i < count; i++) {
    const pos = [
      particles.position[i * 3 + 0],
      particles.position[i * 3 + 1],
      particles.position[i * 3 + 2],
    ];

    const acc = [0, 0, 0];
    computeNodeForce(octree.root, i, pos, particles.mass[i], acc, theta, G, epsilon);

    particles.acceleration[i * 3 + 0] = acc[0];
    particles.acceleration[i * 3 + 1] = acc[1];
    particles.acceleration[i * 3 + 2] = acc[2];
  }
}

function computeNodeForce(node, particleIndex, pos, mass, acc, theta, G, epsilon) {
  // Skip if node is empty
  if (node.mass === 0) return;

  // If this is the particle itself, skip
  if (node.isLeaf() && node.particle === particleIndex) return;

  const dx = node.centerOfMass[0] - pos[0];
  const dy = node.centerOfMass[1] - pos[1];
  const dz = node.centerOfMass[2] - pos[2];
  const distSq = dx * dx + dy * dy + dz * dz;
  const dist = Math.sqrt(distSq);

  // Decide whether to approximate
  const ratio = node.size / dist;

  if (node.isLeaf() || ratio < theta) {
    // Approximate as single mass
    const force = G * node.mass / (distSq + epsilon * epsilon);
    const forceOverDist = force / dist;

    acc[0] += dx * forceOverDist;
    acc[1] += dy * forceOverDist;
    acc[2] += dz * forceOverDist;
  } else {
    // Recurse into children
    for (const child of node.children) {
      computeNodeForce(child, particleIndex, pos, mass, acc, theta, G, epsilon);
    }
  }
}
```

---

## Rendering with InstancedMesh

### Setup

```javascript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleSystem({ particles }) {
  const meshRef = useRef();
  const count = particles.mass.length;

  useEffect(() => {
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = particles.position[i * 3 + 0];
      const y = particles.position[i * 3 + 1];
      const z = particles.position[i * 3 + 2];

      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Set color
      const color = new THREE.Color(
        particles.color[i * 3 + 0],
        particles.color[i * 3 + 1],
        particles.color[i * 3 + 2]
      );
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }, [particles]);

  useFrame(() => {
    // Update positions each frame
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = particles.position[i * 3 + 0];
      const y = particles.position[i * 3 + 1];
      const z = particles.position[i * 3 + 2];

      // Scale based on mass
      const scale = Math.cbrt(particles.mass[i]) * 0.5;

      dummy.position.set(x, y, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}
```

---

## Web Worker Communication

### Main Thread

```javascript
// App.jsx
import { useEffect, useRef, useState } from 'react';

function App() {
  const workerRef = useRef();
  const [particles, setParticles] = useState(null);

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL('./physics/gravity.worker.js', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'update') {
        setParticles(e.data.particles);
      }
    };

    // Initialize simulation
    workerRef.current.postMessage({
      type: 'init',
      particleCount: 10000,
    });

    return () => workerRef.current.terminate();
  }, []);

  const handleParameterChange = (key, value) => {
    workerRef.current.postMessage({
      type: 'setParameter',
      key,
      value,
    });
  };

  return (
    <>
      <Scene particles={particles} />
      <ControlPanel onParameterChange={handleParameterChange} />
    </>
  );
}
```

### Worker Thread

```javascript
// physics/gravity.worker.js
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
      particles = createParticles(e.data.particleCount);
      sendUpdate();
      break;

    case 'setParameter':
      config[e.data.key] = e.data.value;
      break;

    case 'step':
      physicsStep();
      sendUpdate();
      break;
  }
};

function physicsStep() {
  const octree = new Octree(particles, [0, 0, 0], 200);
  computeBarnesHutForce(particles, octree, config.theta, config.G, config.epsilon);
  verletIntegration(particles, config.dt * config.timeScale);
  updateParticleTypes(particles);
  updateColors(particles);
}

function sendUpdate() {
  // Transfer ownership for efficiency
  const positionBuffer = particles.position.slice().buffer;
  const colorBuffer = particles.color.slice().buffer;

  self.postMessage({
    type: 'update',
    particles: {
      position: particles.position.slice(),
      color: particles.color.slice(),
      mass: particles.mass.slice(),
    },
  }, [positionBuffer, colorBuffer]);
}

// Start animation loop
setInterval(() => {
  if (particles) {
    physicsStep();
    sendUpdate();
  }
}, 1000 / 60); // 60 Hz
```

---

## Shader Programs

### Vertex Shader (particle.vert)

```glsl
varying vec3 vColor;
varying vec3 vPosition;

void main() {
  vColor = instanceColor;
  vPosition = position;

  vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
  vec4 mvPosition = modelViewMatrix * worldPosition;

  gl_Position = projectionMatrix * mvPosition;
}
```

### Fragment Shader (particle.frag)

```glsl
varying vec3 vColor;
varying vec3 vPosition;

void main() {
  // Sphere mapping for billboards
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard; // Circular shape

  // Simple lighting
  vec3 normal = normalize(vec3(center, sqrt(0.25 - dist * dist)));
  float diffuse = max(dot(normal, vec3(0, 0, 1)), 0.3);

  // Glow for hot particles
  float glow = smoothstep(0.8, 1.0, vColor.r);

  vec3 finalColor = vColor * diffuse + glow * vec3(1.0, 0.9, 0.8);

  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## Collision Detection

### Spatial Hash (Alternative to Octree)

```javascript
class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  hash(x, y, z) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  insert(particleIndex, pos) {
    const key = this.hash(pos[0], pos[1], pos[2]);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key).push(particleIndex);
  }

  getNeighbors(pos) {
    const neighbors = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = this.hash(
            pos[0] + dx * this.cellSize,
            pos[1] + dy * this.cellSize,
            pos[2] + dz * this.cellSize
          );
          if (this.cells.has(key)) {
            neighbors.push(...this.cells.get(key));
          }
        }
      }
    }
    return neighbors;
  }
}
```

### Collision Handling

```javascript
function handleCollisions(particles, collisionRadius = 0.5) {
  const hash = new SpatialHash(collisionRadius * 2);
  const count = particles.mass.length;
  const merged = new Set();

  // Build spatial hash
  for (let i = 0; i < count; i++) {
    if (merged.has(i)) continue;
    const pos = [
      particles.position[i * 3 + 0],
      particles.position[i * 3 + 1],
      particles.position[i * 3 + 2],
    ];
    hash.insert(i, pos);
  }

  // Check for collisions
  for (let i = 0; i < count; i++) {
    if (merged.has(i)) continue;

    const pos1 = [
      particles.position[i * 3 + 0],
      particles.position[i * 3 + 1],
      particles.position[i * 3 + 2],
    ];

    const neighbors = hash.getNeighbors(pos1);

    for (const j of neighbors) {
      if (i >= j || merged.has(j)) continue;

      const pos2 = [
        particles.position[j * 3 + 0],
        particles.position[j * 3 + 1],
        particles.position[j * 3 + 2],
      ];

      const dx = pos2[0] - pos1[0];
      const dy = pos2[1] - pos1[1];
      const dz = pos2[2] - pos1[2];
      const distSq = dx * dx + dy * dy + dz * dz;
      const threshold = collisionRadius * collisionRadius;

      if (distSq < threshold) {
        mergeParticles(particles, i, j);
        merged.add(j);
      }
    }
  }

  // Remove merged particles
  removeParticles(particles, merged);
}

function mergeParticles(particles, i, j) {
  const m1 = particles.mass[i];
  const m2 = particles.mass[j];
  const totalMass = m1 + m2;

  // Momentum conservation
  for (let k = 0; k < 3; k++) {
    particles.velocity[i * 3 + k] =
      (m1 * particles.velocity[i * 3 + k] + m2 * particles.velocity[j * 3 + k]) / totalMass;
    particles.position[i * 3 + k] =
      (m1 * particles.position[i * 3 + k] + m2 * particles.position[j * 3 + k]) / totalMass;
  }

  particles.mass[i] = totalMass;

  // Heat from collision
  const relVelSq =
    Math.pow(particles.velocity[i * 3] - particles.velocity[j * 3], 2) +
    Math.pow(particles.velocity[i * 3 + 1] - particles.velocity[j * 3 + 1], 2) +
    Math.pow(particles.velocity[i * 3 + 2] - particles.velocity[j * 3 + 2], 2);

  const heatFromCollision = 0.5 * (m1 * m2) / totalMass * relVelSq * 0.01;
  particles.temperature[i] += heatFromCollision;
}
```

---

## Temperature-Based Coloring

```javascript
function temperatureToColor(temperature) {
  // Temperature in Kelvin
  const t = Math.max(10, Math.min(temperature, 50000));

  // Black body radiation approximation
  let r, g, b;

  if (t < 1000) {
    // Cold: brown/gray
    r = 0.3 + t / 3000;
    g = 0.2 + t / 4000;
    b = 0.15 + t / 5000;
  } else if (t < 3000) {
    // Warm: red/orange
    r = 1.0;
    g = (t - 1000) / 2000;
    b = 0;
  } else if (t < 6000) {
    // Yellow/white
    r = 1.0;
    g = 0.8 + (t - 3000) / 15000;
    b = (t - 3000) / 3000;
  } else {
    // Hot: white/blue
    r = 1.0 - (t - 6000) / 44000 * 0.2;
    g = 1.0 - (t - 6000) / 44000 * 0.1;
    b = 1.0;
  }

  return [r, g, b];
}

function updateColors(particles) {
  const count = particles.mass.length;
  for (let i = 0; i < count; i++) {
    const color = temperatureToColor(particles.temperature[i]);
    particles.color[i * 3 + 0] = color[0];
    particles.color[i * 3 + 1] = color[1];
    particles.color[i * 3 + 2] = color[2];
  }
}
```

---

## Time Integration

```javascript
function verletIntegration(particles, dt) {
  const count = particles.mass.length;

  for (let i = 0; i < count; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;

      // Velocity Verlet: v(t + dt/2) = v(t) + a(t) * dt/2
      particles.velocity[idx] += particles.acceleration[idx] * dt * 0.5;

      // Position: x(t + dt) = x(t) + v(t + dt/2) * dt
      particles.position[idx] += particles.velocity[idx] * dt;
    }
  }

  // Recompute accelerations (would be done in next Barnes-Hut step)
  // Then complete the velocity update

  for (let i = 0; i < count; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;

      // Velocity: v(t + dt) = v(t + dt/2) + a(t + dt) * dt/2
      particles.velocity[idx] += particles.acceleration[idx] * dt * 0.5;
    }
  }
}
```

---

## Constants and Configuration

```javascript
// src/utils/constants.js

// Physical constants (SI units)
export const GRAVITATIONAL_CONSTANT = 6.674e-11; // m³ kg⁻¹ s⁻²
export const SOLAR_MASS = 1.989e30; // kg
export const PARSEC = 3.086e16; // meters
export const YEAR = 365.25 * 24 * 3600; // seconds

// Simulation constants (normalized units)
export const G_SIM = 4.49e-3; // pc³ M☉⁻¹ (10⁶ yr)⁻²
export const EPSILON = 0.5; // softening parameter (pc)
export const THETA = 0.5; // Barnes-Hut threshold
export const DT = 0.01; // timestep (10⁶ years)

// Stellar evolution thresholds
export const FUSION_MASS_THRESHOLD = 0.08; // M☉
export const FUSION_TEMP_THRESHOLD = 1e7; // K
export const CHANDRASEKHAR_LIMIT = 1.4; // M☉
export const SUPERNOVA_MASS = 8.0; // M☉

// Collision parameters
export const COLLISION_RADIUS = 0.1; // pc
export const MERGE_THRESHOLD = 0.5; // relative velocity

// Visual parameters
export const MIN_PARTICLE_SIZE = 0.01;
export const MAX_PARTICLE_SIZE = 2.0;
export const BLOOM_THRESHOLD = 0.8; // brightness

// Default simulation settings
export const DEFAULT_PARTICLE_COUNT = 10000;
export const DEFAULT_TIME_SCALE = 100;
export const DEFAULT_DISTRIBUTION_RADIUS = 100; // pc
```

---

## Performance Optimizations

### Particle Culling

```javascript
function cullParticles(particles, camera, frustum) {
  const count = particles.mass.length;
  const visible = [];

  for (let i = 0; i < count; i++) {
    const pos = new THREE.Vector3(
      particles.position[i * 3 + 0],
      particles.position[i * 3 + 1],
      particles.position[i * 3 + 2]
    );

    if (frustum.containsPoint(pos)) {
      visible.push(i);
    }
  }

  return visible;
}
```

### Level of Detail

```javascript
function getLODGeometry(particleCount, cameraDistance) {
  if (particleCount < 1000) {
    return new THREE.SphereGeometry(1, 16, 16); // High detail
  } else if (particleCount < 10000) {
    return new THREE.SphereGeometry(1, 8, 8); // Medium
  } else {
    return new THREE.SphereGeometry(1, 4, 4); // Low
  }
}
```

---

This implementation provides all the building blocks needed to create the galaxy simulator!
