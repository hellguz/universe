import { useSimulationStore } from '../store/simulationStore'
import { MIN_TIME_SCALE, MAX_TIME_SCALE } from '../utils/constants'

export default function ControlPanel() {
  const {
    isPlaying,
    timeScale,
    gravitationalConstant,
    useBarnesHut,
    togglePlay,
    setTimeScale,
    setGravitationalConstant,
    toggleBarnesHut,
    reset
  } = useSimulationStore()

  return (
    <div className="control-panel">
      <h3>Universe Simulator</h3>

      <div className="control-group">
        <label>Time Controls</label>
        <div className="button-group">
          <button onClick={togglePlay} className={isPlaying ? 'active' : ''}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="control-group">
        <label>
          Time Scale
          <span className="control-value">{timeScale}x</span>
        </label>
        <input
          type="range"
          min={MIN_TIME_SCALE}
          max={MAX_TIME_SCALE}
          value={timeScale}
          onChange={(e) => setTimeScale(Number(e.target.value))}
          step="1"
        />
      </div>

      <div className="control-group">
        <label>
          Gravitational Constant
          <span className="control-value">{gravitationalConstant.toFixed(4)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="0.001"
          value={gravitationalConstant}
          onChange={(e) => setGravitationalConstant(Number(e.target.value))}
          step="0.00001"
        />
      </div>

      <div className="control-group">
        <label>Gravity Calculation Method</label>
        <div className="button-group">
          <button
            onClick={toggleBarnesHut}
            className={useBarnesHut ? 'active' : ''}
            style={{ fontSize: '12px', padding: '8px 12px' }}
          >
            {useBarnesHut ? '🌌 Barnes-Hut (Fast)' : '⚡ Simple (Slow)'}
          </button>
        </div>
        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>
          {useBarnesHut
            ? 'O(N log N) hierarchical approximation'
            : 'O(N) fixed-sample approximation'
          }
        </label>
      </div>

      <div className="control-group">
        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
          Compare performance by toggling gravity methods
        </label>
      </div>
    </div>
  )
}
