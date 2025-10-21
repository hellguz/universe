import { create } from 'zustand';

export const useSimulationStore = create((set) => ({
  isRunning: true,
  timeScale: 1,
  G: 1.0,
  theta: 0.5,

  togglePause: () => set((state) => ({ isRunning: !state.isRunning })),
  setTimeScale: (scale) => set({ timeScale: scale }),
  setG: (value) => set({ G: value }),
  setTheta: (value) => set({ theta: value }),
}));
