import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.initialized) {
      const unsubscribe = store.init();
      return unsubscribe;
    }
  }, [store.initialized]);

  return {
    user: store.user,
    loading: store.loading,
    isAuthenticated: !!store.user,
    signIn: store.signIn,
    signUp: store.signUp,
    signInWithGoogle: store.signInWithGoogle,
    signOut: store.signOut,
    resetPassword: store.resetPassword,
  };
};
