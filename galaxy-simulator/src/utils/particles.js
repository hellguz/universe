export function createParticles(count) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const accelerations = new Float32Array(count * 3);
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

    // Small random initial velocity
    velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

    // Initialize accelerations to zero
    accelerations[i * 3 + 0] = 0;
    accelerations[i * 3 + 1] = 0;
    accelerations[i * 3 + 2] = 0;

    // Random color (will be temperature-based later) - much brighter
    colors[i * 3 + 0] = 0.8 + Math.random() * 0.2; // R - bright red
    colors[i * 3 + 1] = 0.4 + Math.random() * 0.4; // G - orange tone
    colors[i * 3 + 2] = 0.1 + Math.random() * 0.2; // B - minimal blue

    masses[i] = Math.random() * 0.001;
  }

  return { positions, velocities, accelerations, colors, masses, count };
}
