import { create } from 'zustand';
import { pb } from '../lib/pocketbase';

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

const mapRecord = (r: any): AIGeneration => ({
  id: r.id,
  prompt: r.prompt,
  html: r.html,
  createdAt: new Date(r.created),
});

export const useHistoryStore = create<HistoryState>((set) => ({
  generations: [],
  loading: false,

  loadHistory: async (userId) => {
    set({ loading: true });
    try {
      const records = await pb.collection('generations').getFullList({
        filter: `user = "${userId}"`,
        sort: '-created',
      });
      set({ generations: records.map(mapRecord) });
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      set({ loading: false });
    }
  },

  saveGeneration: async (userId, prompt, html) => {
    try {
      const record = await pb.collection('generations').create({
        user: userId,
        prompt,
        html,
      });
      const newGen = mapRecord(record);
      set((s) => ({ generations: [newGen, ...s.generations] }));
    } catch (error) {
      console.error('Error saving generation:', error);
    }
  },

  deleteGeneration: async (id) => {
    try {
      await pb.collection('generations').delete(id);
      set((s) => ({ generations: s.generations.filter((g) => g.id !== id) }));
    } catch (error) {
      console.error('Error deleting generation:', error);
    }
  },
}));
