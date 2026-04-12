import { useEffect, useRef } from 'react';
import { useVisualizerStore } from '../stores/visualizerStore';

export const useVisualizer = () => {
  const store = useVisualizerStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (store.isPlaying) {
      const delay = Math.max(10, 1010 - store.speed * 10);
      intervalRef.current = window.setInterval(() => {
        const { currentStep, steps } = useVisualizerStore.getState();
        if (currentStep < steps.length - 1) {
          useVisualizerStore.setState({ currentStep: currentStep + 1 });
        } else {
          useVisualizerStore.setState({ isPlaying: false });
        }
      }, delay);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [store.isPlaying, store.speed]);

  const currentStepData = store.steps[store.currentStep] || null;

  return { ...store, currentStepData };
};
