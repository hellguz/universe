import { useSimulationStore } from '../store/simulation';

export function ControlPanel() {
  const { isRunning, timeScale, G, theta, togglePause, setTimeScale, setG, setTheta } = useSimulationStore();

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: 20,
      borderRadius: 8,
      minWidth: 200,
      fontFamily: 'monospace',
      fontSize: '14px',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 15 }}>Controls</h3>

      <button
        onClick={togglePause}
        style={{
          width: '100%',
          marginBottom: 15,
          padding: 8,
          fontSize: '14px',
          cursor: 'pointer',
          background: isRunning ? '#ff4444' : '#44ff44',
          color: 'black',
          border: 'none',
          borderRadius: 4,
          fontWeight: 'bold',
        }}
      >
        {isRunning ? 'Pause' : 'Play'}
      </button>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>
          Time Scale: {timeScale.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={timeScale}
          onChange={(e) => setTimeScale(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>
          Gravity: {G.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={G}
          onChange={(e) => setG(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 5 }}>
          Theta: {theta.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={theta}
          onChange={(e) => setTheta(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
