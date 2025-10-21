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
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const accelerations = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const masses = new Float32Array(count);
  const temperatures = new Float32Array(count);
  const types = new Uint8Array(count);

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

    // Initial color (will be updated by temperature)
    colors[i * 3 + 0] = 0.3;
    colors[i * 3 + 1] = 0.2;
    colors[i * 3 + 2] = 0.15;

    masses[i] = Math.random() * 0.001;
    temperatures[i] = 10 + Math.random() * 10; // 10-20 K
    types[i] = ParticleType.DUST;
  }

  return { positions, velocities, accelerations, colors, masses, temperatures, types, count };
}
