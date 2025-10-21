import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { ParticleSystem } from './ParticleSystem';
import { computeGravity } from '../utils/gravity';
import { verletStep } from '../utils/integration';
import { useSimulationStore } from '../store/simulation';

function PhysicsLoop({ particles }) {
  const { isRunning, timeScale, G } = useSimulationStore();

  useFrame(() => {
    if (!isRunning) return;

    const dt = 0.01 * timeScale;
    computeGravity(particles, G);
    verletStep(particles, dt);
  });

  return null;
}

export function Scene({ particles }) {
  return (
    <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
      <color attach="background" args={['#000000']} />
      <ParticleSystem particles={particles} />
      <PhysicsLoop particles={particles} />
      <OrbitControls />
      <Stats />
    </Canvas>
  );
}
