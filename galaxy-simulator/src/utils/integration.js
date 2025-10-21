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
