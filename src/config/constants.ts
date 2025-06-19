// Application constants and configuration
export const APP_CONFIG = {
  name: 'Algorhythm',
  description: 'Interactive Algorithm Visualizer',
  version: '1.0.0',
  author: 'Algorhythm Team',
  repository: 'https://github.com/yourusername/algorhythm',
  demo: 'https://algorhythm.netlify.app',
} as const;

export const API_CONFIG = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  n8n: {
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
    apiKey: import.meta.env.VITE_N8N_API_KEY,
  },
} as const;

export const FEATURES = {
  authentication: true,
  realTimeUpdates: true,
  n8nIntegration: true,
  adminDashboard: true,
  downloadSolutions: true,
} as const;

export const LIMITS = {
  maxQuestionLength: 1000,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxQuestionsPerUser: 100,
  pollingInterval: 30000, // 30 seconds
} as const;