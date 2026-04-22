export const APP_CONFIG = {
  name: 'Algorhythm',
  description: 'Interactive Algorithm Visualizer',
  version: '2.0.0',
} as const;

export const POCKETBASE_CONFIG = {
  url: import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090',
} as const;

export const VISUALIZER_CONFIG = {
  defaultSpeed: 50,
  minSpeed: 1,
  maxSpeed: 100,
  defaultArraySize: 20,
  maxArraySize: 50,
  maxArrayValue: 100,
} as const;

export const AI_CONFIG = {
  generateEndpoint: '/api/generate-visualization',
  maxGenerationsPerDay: 10,
} as const;
