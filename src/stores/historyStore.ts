import { create } from 'zustand';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

export const useHistoryStore = create<HistoryState>((set, _get) => ({
  generations: [],
  loading: false,

  loadHistory: async (userId) => {
    set({ loading: true });
    try {
      const q = query(
        collection(db, 'generations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const generations = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp).toDate(),
      })) as AIGeneration[];
      set({ generations });
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      set({ loading: false });
    }
  },

  saveGeneration: async (userId, prompt, html) => {
    try {
      const docRef = await addDoc(collection(db, 'generations'), {
        userId, prompt, html, createdAt: Timestamp.now(),
      });
      const newGen: AIGeneration = { id: docRef.id, prompt, html, createdAt: new Date() };
      set((s) => ({ generations: [newGen, ...s.generations] }));
    } catch (error) {
      console.error('Error saving generation:', error);
    }
  },

  deleteGeneration: async (id) => {
    try {
      await deleteDoc(doc(db, 'generations', id));
      set((s) => ({ generations: s.generations.filter((g) => g.id !== id) }));
    } catch (error) {
      console.error('Error deleting generation:', error);
    }
  },
}));
