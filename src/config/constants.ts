export const APP_CONFIG = {
  name: 'Algorhythm',
  description: 'Interactive Algorithm Visualizer',
  version: '2.0.0',
  repository: 'https://github.com/singlaamitesh/algorhythm',
} as const;

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
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
  generateEndpoint: '/.netlify/functions/generate-visualization',
  maxGenerationsPerDay: 10,
} as const;
