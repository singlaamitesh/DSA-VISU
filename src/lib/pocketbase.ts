import PocketBase from 'pocketbase';
import { POCKETBASE_CONFIG } from '../config/constants';

export const pb = new PocketBase(POCKETBASE_CONFIG.url);

// Persist auth state across page reloads (PocketBase handles this via localStorage)
pb.authStore.onChange(() => {
  // Hook available for cross-tab sync if needed
});
