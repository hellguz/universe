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
