import { create } from 'zustand';
import { AlgorithmConfig, AnimationStep } from '../algorithms/types';

interface VisualizerState {
  algorithm: AlgorithmConfig | null;
  steps: AnimationStep[];
  currentStep: number;
  speed: number;
  isPlaying: boolean;
  data: unknown;

  setAlgorithm: (algorithm: AlgorithmConfig) => void;
  setData: (data: unknown) => void;
  generateSteps: () => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  setCurrentStep: (step: number) => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  algorithm: null,
  steps: [],
  currentStep: 0,
  speed: 50,
  isPlaying: false,
  data: null,

  setAlgorithm: (algorithm) => {
    set({ algorithm, steps: [], currentStep: 0, isPlaying: false, data: algorithm.defaultInput });
  },

  setData: (data) => {
    set({ data, steps: [], currentStep: 0, isPlaying: false });
  },

  generateSteps: () => {
    const { algorithm, data } = get();
    if (!algorithm || !data) return;

    const steps: AnimationStep[] = [];
    const gen = algorithm.generator(data);
    let result = gen.next();
    while (!result.done) {
      steps.push(result.value);
      result = gen.next();
    }
    if (result.value) steps.push(result.value);

    set({ steps, currentStep: 0, isPlaying: false });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  stepForward: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  stepBackward: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  reset: () => set({ currentStep: 0, isPlaying: false }),

  setSpeed: (speed) => set({ speed }),

  setCurrentStep: (step) => set({ currentStep: step }),
}));
