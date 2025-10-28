import { useSimulationStore } from '../store/simulationStore'
import { MIN_TIME_SCALE, MAX_TIME_SCALE, UNIVERSE_TIME_SCALE } from '../utils/constants'

export default function ControlPanel() {
  const {
    isPlaying,
    timeScale,
    gravitationalConstant,
    useBarnesHut,
    currentTime,
    universeAge,
    darkMatterCount,
    gasCount,
    starCount,
    mainSequenceCount,
    redGiantCount,
    whiteDwarfCount,
    neutronStarCount,
    blackHoleCount,
    togglePlay,
    setTimeScale,
    setGravitationalConstant,
    toggleBarnesHut,
    reset
  } = useSimulationStore()

  // Format universe age display
  const formatUniverseAge = () => {
    if (universeAge < 1) {
      return `${(universeAge * 1000).toFixed(0)} Myr` // Million years
    } else {
      return `${universeAge.toFixed(2)} Gyr` // Billion years
    }
  }

  // Format real time display
  const formatRealTime = () => {
    const minutes = Math.floor(currentTime / 60)
    const seconds = Math.floor(currentTime % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="control-panel">
      <h3>Universe Simulator</h3>

      <div className="control-group" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px', marginBottom: '12px' }}>
        <label style={{ fontSize: '13px', color: 'rgba(255, 220, 150, 1)', marginBottom: '8px' }}>
          🌌 Universe Age
        </label>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'rgba(255, 230, 180, 1)', marginBottom: '4px' }}>
          {formatUniverseAge()}
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
          Real time: {formatRealTime()} (1s = {UNIVERSE_TIME_SCALE} Myr)
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          Real universe age: ~13.8 Gyr
        </div>
      </div>

      <div className="control-group">
        <label>Particle Counts</label>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: 'rgba(128, 64, 192, 1)' }}>⬤ Dark Matter:</span>
            <span>{darkMatterCount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: 'rgba(51, 153, 255, 1)' }}>⬤ Gas:</span>
            <span>{gasCount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: 'rgba(255, 200, 100, 1)' }}>⬤ Stars (Total):</span>
            <span>{starCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="control-group">
        <label>Stellar Evolution</label>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '5px', marginLeft: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: 'rgba(150, 200, 255, 1)' }}>⚬ Main Sequence:</span>
            <span>{mainSequenceCount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: 'rgba(255, 120, 40, 1)' }}>⚬ Red Giants:</span>
            <span>{redGiantCount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: 'rgba(220, 230, 255, 1)' }}>⚬ White Dwarfs:</span>
            <span>{whiteDwarfCount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ color: 'rgba(100, 220, 255, 1)' }}>⚬ Neutron Stars:</span>
            <span>{neutronStarCount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(200, 100, 255, 1)' }}>⚬ Black Holes:</span>
            <span>{blackHoleCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

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
