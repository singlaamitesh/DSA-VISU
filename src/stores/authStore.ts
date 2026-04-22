import { create } from 'zustand';
import type { RecordModel } from 'pocketbase';
import { pb } from '../lib/pocketbase';

// PocketBase user record — the `users` collection fields
export interface PBUser extends RecordModel {
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  user: PBUser | null;
  token: string;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (pb.authStore.model as PBUser | null) || null,
  token: pb.authStore.token,
  loading: false,
  initialized: false,

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      set({ user: authData.record as PBUser, token: authData.token });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true });
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      });
      // Auto sign-in after signup
      const authData = await pb.collection('users').authWithPassword(email, password);
      set({ user: authData.record as PBUser, token: authData.token });
    } finally {
      set({ loading: false });
    }
  },

  signOut: () => {
    pb.authStore.clear();
    set({ user: null, token: '' });
  },

  init: () => {
    // Sync state with PocketBase auth store on mount + changes
    const updateState = () => {
      set({
        user: (pb.authStore.model as PBUser | null) || null,
        token: pb.authStore.token,
        initialized: true,
        loading: false,
      });
    };

    updateState();
    const unsubscribe = pb.authStore.onChange(updateState);
    return unsubscribe;
  },
}));
