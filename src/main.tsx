import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { validateEnvironment } from './utils/validation'
import { logError } from './utils/errorHandling'

// Validate environment variables on startup
try {
  validateEnvironment();
} catch (error) {
  logError(error, 'Environment Validation');
  console.error('❌ Environment validation failed:', error);
  
  // Show user-friendly error in development
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        background: #0f172a; 
        color: #e2e8f0; 
        font-family: system-ui, sans-serif;
        padding: 2rem;
      ">
        <div style="
          max-width: 600px; 
          text-align: center; 
          background: #1e293b; 
          padding: 2rem; 
          border-radius: 1rem; 
          border: 1px solid #334155;
        ">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Configuration Error</h1>
          <p style="margin-bottom: 1rem;">${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p style="color: #94a3b8; font-size: 0.9rem;">
            Please check your <code>.env</code> file and ensure all required environment variables are set.
            <br><br>
            Copy <code>.env.example</code> to <code>.env</code> and fill in your Supabase credentials.
          </p>
        </div>
      </div>
    `;
    throw error;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)