import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface AIGeneration {
  id: string;
  prompt: string;
  html: string;
  createdAt: Date;
}

interface HistoryState {
  generations: AIGeneration[];
  loading: boolean;
  loadHistory: (userId: string) => Promise<void>;
  saveGeneration: (userId: string, prompt: string, html: string) => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  generations: [],
  loading: false,

  loadHistory: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const generations = (data || []).map((d: any) => ({
        id: d.id,
        prompt: d.prompt,
        html: d.html,
        createdAt: new Date(d.created_at),
      }));
      set({ generations });
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      set({ loading: false });
    }
  },

  saveGeneration: async (userId, prompt, html) => {
    try {
      const { data, error } = await supabase
        .from('generations')
        .insert([{ user_id: userId, prompt, html }])
        .select()
        .single();

      if (error) throw error;

      const newGen: AIGeneration = {
        id: data.id,
        prompt: data.prompt,
        html: data.html,
        createdAt: new Date(data.created_at),
      };
      set((s) => ({ generations: [newGen, ...s.generations] }));
    } catch (error) {
      console.error('Error saving generation:', error);
    }
  },

  deleteGeneration: async (id) => {
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set((s) => ({ generations: s.generations.filter((g) => g.id !== id) }));
    } catch (error) {
      console.error('Error deleting generation:', error);
    }
  },
}));
