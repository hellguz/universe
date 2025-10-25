import { useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'

let frameCount = 0
let lastTime = performance.now()

export default function HUD() {
  const { fps, particleCount, currentTime, isPlaying, timeScale, setFps } = useSimulationStore()

  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      const currentFps = frameCount / delta
      setFps(Math.round(currentFps))
      frameCount = 0
      lastTime = now
    }, 1000)

    return () => clearInterval(interval)
  }, [setFps])

  // Count frames
  useEffect(() => {
    const animate = () => {
      frameCount++
      requestAnimationFrame(animate)
    }
    animate()
  }, [])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`
    return `${(seconds / 86400).toFixed(1)}d`
  }

  return (
    <div className="hud">
      <div className="hud-item">
        <span className="hud-label">FPS:</span>
        <span className="hud-value">{fps}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">Particles:</span>
        <span className="hud-value">{particleCount.toLocaleString()}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">Time:</span>
        <span className="hud-value">{formatTime(currentTime)}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">Status:</span>
        <span className="hud-value">{isPlaying ? 'Running' : 'Paused'}</span>
      </div>
      <div className="hud-item">
        <span className="hud-label">Speed:</span>
        <span className="hud-value">{timeScale}x</span>
      </div>
    </div>
  )
}
