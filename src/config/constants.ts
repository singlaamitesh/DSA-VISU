export const APP_CONFIG = {
  name: 'Algorhythm',
  description: 'Interactive Algorithm Visualizer',
  version: '2.0.0',
  repository: 'https://github.com/singlaamitesh/algorhythm',
} as const;

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
