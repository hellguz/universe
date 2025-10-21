import { useState, useEffect } from 'react';
import { Scene } from './Scene';
import { ControlPanel } from './ControlPanel';
import { useSimulationStore } from '../store/simulation';

export function App() {
  const [particles, setParticles] = useState(null);
  const [worker, setWorker] = useState(null);
  const { timeScale, G, theta, isRunning } = useSimulationStore();

  useEffect(() => {
    const physicsWorker = new Worker(
      new URL('../physics/gravity.worker.js', import.meta.url),
      { type: 'module' }
    );

    physicsWorker.onmessage = (e) => {
      if (e.data.type === 'update' || e.data.type === 'ready') {
        setParticles(e.data.particles);
      }
    };

    physicsWorker.postMessage({ type: 'init', count: 10000 });
    setWorker(physicsWorker);

    return () => physicsWorker.terminate();
  }, []);

  useEffect(() => {
    if (worker) {
      worker.postMessage({
        type: 'setConfig',
        config: { timeScale, G, theta, isRunning }
      });
    }
  }, [worker, timeScale, G, theta, isRunning]);

  if (!particles) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        background: '#000'
      }}>
        Loading 10,000 particles...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Scene particles={particles} useWorker={true} />
      <ControlPanel />
    </div>
  );
}
