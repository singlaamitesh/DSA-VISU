export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }

    if (error.message.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link to activate your account.';
    }

    if (error.message.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }

    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

export const logError = (error: unknown, context?: string) => {
  console.error(`[${context || 'App'}] Error:`, error);
  
  // In production, you might want to send errors to a logging service
  if (import.meta.env.PROD) {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { context });
  }
};