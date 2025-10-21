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
