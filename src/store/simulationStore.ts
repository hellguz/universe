import { create } from 'zustand'
import {
  GRAVITATIONAL_CONSTANT,
  DEFAULT_TIME_SCALE,
  PARTICLE_COUNT
} from '../utils/constants'

interface SimulationState {
  // Simulation state
  isPlaying: boolean
  timeScale: number
  gravitationalConstant: number
  particleCount: number
  currentTime: number
  fps: number

  // Actions
  togglePlay: () => void
  setTimeScale: (scale: number) => void
  setGravitationalConstant: (g: number) => void
  setCurrentTime: (time: number) => void
  setFps: (fps: number) => void
  reset: () => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  // Initial state
  isPlaying: true,
  timeScale: DEFAULT_TIME_SCALE,
  gravitationalConstant: GRAVITATIONAL_CONSTANT,
  particleCount: PARTICLE_COUNT,
  currentTime: 0,
  fps: 0,

  // Actions
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setTimeScale: (scale: number) => set({ timeScale: scale }),

  setGravitationalConstant: (g: number) => set({ gravitationalConstant: g }),

  setCurrentTime: (time: number) => set({ currentTime: time }),

  setFps: (fps: number) => set({ fps }),

  reset: () => set({
    isPlaying: false,
    timeScale: DEFAULT_TIME_SCALE,
    gravitationalConstant: GRAVITATIONAL_CONSTANT,
    currentTime: 0
  })
}))
