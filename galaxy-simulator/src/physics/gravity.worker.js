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
  isRunning: true,
};

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
        computeBarnesHutGravity(particles, config.G, config.epsilon, config.theta);
        verletStep(particles, config.dt * config.timeScale);
        self.postMessage({
          type: 'update',
          particles: serializeParticles(particles)
        });
      }
      break;
  }
};

function serializeParticles(p) {
  return {
    positions: p.positions,
    velocities: p.velocities,
    accelerations: p.accelerations,
    colors: p.colors,
    masses: p.masses,
    count: p.count,
  };
}

// Auto-step at 60 Hz
setInterval(() => {
  if (particles && config.isRunning) {
    computeBarnesHutGravity(particles, config.G, config.epsilon, config.theta);
    verletStep(particles, config.dt * config.timeScale);
    self.postMessage({
      type: 'update',
      particles: serializeParticles(particles)
    });
  }
}, 1000 / 60);
