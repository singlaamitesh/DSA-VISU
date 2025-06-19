import { LIMITS } from '../config/constants';

export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar] || import.meta.env[envVar].includes('configure-in-env-file')
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`
    );
  }
};

export const validateQuestion = (question: string): { isValid: boolean; error?: string } => {
  if (!question.trim()) {
    return { isValid: false, error: 'Question cannot be empty' };
  }

  if (question.length > LIMITS.maxQuestionLength) {
    return { 
      isValid: false, 
      error: `Question must be less than ${LIMITS.maxQuestionLength} characters` 
    };
  }

  return { isValid: true };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }

  return { isValid: true };
};