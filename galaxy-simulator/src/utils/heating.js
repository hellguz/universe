import { Octree } from './octree';

export function computeHeating(particles) {
  const count = particles.count;
  const octree = new Octree(particles, [0, 0, 0], 200);

  for (let i = 0; i < particles.count; i++) {
    // Simple density-based heating using nearby particle count
    let nearbyCount = 0;
    const searchRadius = 5;

    for (let j = 0; j < count; j++) {
      if (i === j) continue;

      const dx = particles.positions[j * 3] - particles.positions[i * 3];
      const dy = particles.positions[j * 3 + 1] - particles.positions[i * 3 + 1];
      const dz = particles.positions[j * 3 + 2] - particles.positions[i * 3 + 2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < searchRadius * searchRadius) {
        nearbyCount++;
      }
    }

    // Temperature increases with density
    const densityFactor = nearbyCount * 0.05;
    particles.temperatures[i] += densityFactor;

    // Cooling (radiation) - higher temperatures cool faster
    const coolingRate = 0.9995 + (particles.temperatures[i] / 100000) * 0.0005;
    particles.temperatures[i] *= coolingRate;

    // Minimum temperature
    if (particles.temperatures[i] < 10) {
      particles.temperatures[i] = 10;
    }
  }
}
