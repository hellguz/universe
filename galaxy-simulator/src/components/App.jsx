import { useMemo } from 'react';
import { Scene } from './Scene';
import { createParticles } from '../utils/particles';

export function App() {
  const particles = useMemo(() => createParticles(1000), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Scene particles={particles} />
    </div>
  );
}
