export const validateEnvironment = () => {
  if (!import.meta.env.VITE_POCKETBASE_URL) {
    console.warn('VITE_POCKETBASE_URL not set, using default http://127.0.0.1:8090');
  }
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
};
