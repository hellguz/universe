import { computeBarnesHutGravity } from '../utils/barnesHut';
import { verletStep } from '../utils/integration';
import { createParticles } from '../utils/particles';
import { computeHeating } from '../utils/heating';
import { updateStellarTypes } from '../utils/stellar';
import { updateColors } from '../utils/colormap';

let particles = null;
let config = {
  G: 1.0,
  epsilon: 0.5,
  theta: 0.5,
  dt: 0.01,
  timeScale: 1,
  isRunning: true,
};

let frameCount = 0;

self.onmessage = (e) => {
  switch (e.data.type) {
    case 'init':
      particles = createParticles(e.data.count);
      self.postMessage({
        type: 'ready',
        particles: serializeParticles(particles)
      });
      break;

    case 'setConfig':
      config = { ...config, ...e.data.config };
      break;

    case 'step':
      if (particles && config.isRunning) {
        physicsStep();
        self.postMessage({
          type: 'update',
          particles: serializeParticles(particles)
        });
      }
      break;
  }
};

function physicsStep() {
  // Gravity and motion
  computeBarnesHutGravity(particles, config.G, config.epsilon, config.theta);
  verletStep(particles, config.dt * config.timeScale);

  // Only run expensive operations every few frames
  frameCount++;

  if (frameCount % 10 === 0) {
    // Heating (expensive, run every 10 frames)
    computeHeating(particles);
    updateStellarTypes(particles);
    updateColors(particles);
  }
}

function serializeParticles(p) {
  return {
    positions: p.positions,
    velocities: p.velocities,
    accelerations: p.accelerations,
    colors: p.colors,
    masses: p.masses,
    temperatures: p.temperatures,
    types: p.types,
    count: p.count,
  };
}

// Auto-step at 60 Hz
setInterval(() => {
  if (particles && config.isRunning) {
    physicsStep();
    self.postMessage({
      type: 'update',
      particles: serializeParticles(particles)
    });
  }
}, 1000 / 60);
