import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { ParticleSystem } from './ParticleSystem';

export function Scene({ particles }) {
  return (
    <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
      <color attach="background" args={['#000000']} />
      <ParticleSystem particles={particles} />
      <OrbitControls />
      <Stats />
    </Canvas>
  );
}
