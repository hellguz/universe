# Galaxy Genesis Simulator

A real-time 3D galaxy formation simulator built with React Three Fiber and Vike. Watch the universe unfold from primordial dust to complex stellar systems.

## Overview

Galaxy Genesis simulates the formation and evolution of galaxies from the ground up. Starting with nothing but cosmic dust, witness gravity sculpt matter into gas clouds, compress them into blazing stars, watch planets coalesce from debris, and observe the dramatic finale of supernovas and black holes.

This is not just a visualization—it's a physics-based particle simulation that follows real gravitational laws, thermodynamics, and stellar evolution principles.

## Features

- **From Nothing to Everything**: Begins with scattered dust particles
- **Real Physics**: Newtonian gravity, gas compression, thermodynamic heating
- **Stellar Evolution**: Watch dust → gas giants → stars → supernovas → black holes
- **Interactive**: Zoom, pan, rotate to explore your universe
- **Time Control**: Speed up time from 1x to 1,000,000x
- **Tweakable**: Adjust gravitational constant and other fundamental parameters
- **Beautiful**: Temperature-based coloring, particle trails, realistic rendering

## Technology Stack

- **Frontend**: React + Vike (file-based routing)
- **3D Rendering**: React Three Fiber (@react-three/fiber, @react-three/drei)
- **Physics**: Custom WebGL compute shaders + Web Workers
- **State**: Zustand
- **Package Manager**: Yarn

## Quick Start

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
```

## Documentation

This project is documented in detail across multiple files:

- **[CONCEPT.md](CONCEPT.md)** - Vision, goals, and feature descriptions
- **[PHYSICS.md](PHYSICS.md)** - Mathematical models and physics equations
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and component design
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Implementation details, data structures, algorithms
- **[DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)** - 4-step incremental development plan
- **[UI_DESIGN.md](UI_DESIGN.md)** - User interface specifications

## Development Philosophy

This project is built incrementally in 4 testable steps:

1. **Setup & Basic Rendering** - See particles on screen
2. **Basic Physics** - Particles attract and move
3. **Optimization** - Handle 10,000+ particles smoothly
4. **Advanced Features** - Full stellar lifecycle simulation

Each step is visually testable in the browser before moving forward.

## Project Structure

```
galaxy-simulator/
├── docs/                    # Documentation files
├── src/
│   ├── pages/              # Vike pages
│   ├── components/
│   │   ├── Scene.jsx       # Main 3D scene wrapper
│   │   ├── ParticleSystem.jsx
│   │   ├── ControlPanel.jsx
│   │   └── Camera.jsx
│   ├── physics/
│   │   ├── gravity.worker.js
│   │   ├── octree.js
│   │   └── particles.js
│   ├── shaders/
│   │   ├── particle.vert
│   │   ├── particle.frag
│   │   └── compute.glsl
│   └── store/
│       └── simulation.js   # Zustand store
└── package.json
```

## Controls

- **Mouse**: Rotate camera (drag), zoom (scroll)
- **UI Panel**: Adjust time speed, gravity, and other parameters
- **Space**: Pause/Resume simulation
- **R**: Reset simulation

## Performance

- Simulates 10,000-100,000 particles in real-time
- GPU-accelerated rendering using instanced meshes
- Physics calculations in Web Worker thread
- Barnes-Hut octree algorithm for O(n log n) gravity
- Spatial partitioning for efficient collision detection

## Contributing

This is a learning project built incrementally. Follow the development roadmap for planned features.

## License

MIT
