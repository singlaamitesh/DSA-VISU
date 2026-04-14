import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/constants';

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.warn('Supabase not configured. Check your .env file.');
}

export const supabase = createClient(
  SUPABASE_CONFIG.url || '',
  SUPABASE_CONFIG.anonKey || ''
);
