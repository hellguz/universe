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
  universeAge: number // Universe age in Gyr (gigayears)
  fps: number
  useBarnesHut: boolean // Toggle between Barnes-Hut and old system
  resetKey: number // Increment to trigger particle reinitialization

  // Particle type counts
  darkMatterCount: number
  gasCount: number
  starCount: number
  // Stellar evolution counts
  mainSequenceCount: number
  redGiantCount: number
  whiteDwarfCount: number

  // Actions
  togglePlay: () => void
  setTimeScale: (scale: number) => void
  setGravitationalConstant: (g: number) => void
  setCurrentTime: (time: number) => void
  setUniverseAge: (age: number) => void
  setFps: (fps: number) => void
  toggleBarnesHut: () => void
  reset: () => void
  setParticleCounts: (darkMatter: number, gas: number, stars: number) => void
  setStellarCounts: (mainSequence: number, redGiant: number, whiteDwarf: number) => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  // Initial state
  isPlaying: true,
  timeScale: DEFAULT_TIME_SCALE,
  gravitationalConstant: GRAVITATIONAL_CONSTANT,
  particleCount: PARTICLE_COUNT,
  currentTime: 0,
  universeAge: 0, // Starts at 0 Gyr (Big Bang)
  fps: 0,
  useBarnesHut: true, // Start with Barnes-Hut enabled
  resetKey: 0,

  // Initial particle counts - Scientific: Universe starts with NO STARS
  darkMatterCount: Math.floor(PARTICLE_COUNT * 0.60), // 60% dark matter
  gasCount: Math.floor(PARTICLE_COUNT * 0.40), // 40% gas (primordial)
  starCount: 0, // 0% stars - they form from gas over time!

  // Initial stellar evolution counts
  mainSequenceCount: 0, // No stars at universe start
  redGiantCount: 0,
  whiteDwarfCount: 0,

  // Actions
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setTimeScale: (scale: number) => set({ timeScale: scale }),

  setGravitationalConstant: (g: number) => set({ gravitationalConstant: g }),

  setCurrentTime: (time: number) => set({ currentTime: time }),

  setUniverseAge: (age: number) => set({ universeAge: age }),

  setFps: (fps: number) => set({ fps }),

  setParticleCounts: (darkMatter: number, gas: number, stars: number) => set({
    darkMatterCount: darkMatter,
    gasCount: gas,
    starCount: stars
  }),

  setStellarCounts: (mainSequence: number, redGiant: number, whiteDwarf: number) => set({
    mainSequenceCount: mainSequence,
    redGiantCount: redGiant,
    whiteDwarfCount: whiteDwarf
  }),

  toggleBarnesHut: () => set((state) => ({
    useBarnesHut: !state.useBarnesHut,
    // Reset simulation when switching modes to avoid incompatible state
    resetKey: state.resetKey + 1,
    currentTime: 0,
    universeAge: 0,
    isPlaying: true
  })),

  reset: () => set((state) => ({
    isPlaying: false,
    timeScale: DEFAULT_TIME_SCALE,
    gravitationalConstant: GRAVITATIONAL_CONSTANT,
    currentTime: 0,
    universeAge: 0,
    resetKey: state.resetKey + 1,
    // Reset counts to initial values - Scientific initial conditions
    darkMatterCount: Math.floor(PARTICLE_COUNT * 0.60),
    gasCount: Math.floor(PARTICLE_COUNT * 0.40),
    starCount: 0,
    mainSequenceCount: 0,
    redGiantCount: 0,
    whiteDwarfCount: 0
  }))
}))
