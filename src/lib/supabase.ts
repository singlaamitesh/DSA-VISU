import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../config/constants';

const supabaseUrl = API_CONFIG.supabase.url;
const supabaseAnonKey = API_CONFIG.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface UserQuestion {
  id: string;
  question: string;
  user_email?: string;
  user_name?: string;
  user_id?: string;
  preferred_language?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_solution?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_language: 'javascript' | 'python' | 'java' | 'cpp' | 'c' | 'go' | 'rust' | 'typescript';
  theme: 'light' | 'dark';
  notification_preferences: {
    email: boolean;
    browser: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

// Programming language options
export const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'c', label: 'C', icon: '🔧' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
] as const;

// Authentication functions
export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  },

  // Subscribe to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },
};

// User preferences functions
export const preferencesService = {
  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user preferences:', error);
      throw error;
    }

    return data;
  },

  // Get or create user preferences
  async getOrCreateUserPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase.rpc('get_or_create_user_preferences', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error getting/creating user preferences:', error);
      throw error;
    }

    return data;
  },

  // Update user language preference
  async updateUserLanguage(userId: string, language: string) {
    const { data, error } = await supabase.rpc('update_user_language', {
      target_user_id: userId,
      new_language: language
    });

    if (error) {
      console.error('Error updating user language:', error);
      throw error;
    }

    return data;
  },

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }

    return data;
  },

  // Get user's preferred language
  async getUserLanguage(userId: string): Promise<string> {
    const { data, error } = await supabase.rpc('get_user_language', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error getting user language:', error);
      return 'javascript'; // Default fallback
    }

    return data || 'javascript';
  },
};

// Database functions
export const questionService = {
  // Create a new question
  async createQuestion(data: {
    question: string;
    user_email?: string;
    user_name?: string;
    user_id?: string;
    preferred_language?: string;
  }): Promise<UserQuestion | null> {
    // If user_id is provided but no preferred_language, get user's preference
    if (data.user_id && !data.preferred_language) {
      try {
        data.preferred_language = await preferencesService.getUserLanguage(data.user_id);
      } catch (error) {
        console.warn('Could not get user language preference, using default');
        data.preferred_language = 'javascript';
      }
    }

    const { data: result, error } = await supabase
      .from('user_questions')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }

    return result;
  },

  // Get all questions (for admin/n8n)
  async getAllQuestions(): Promise<UserQuestion[]> {
    const { data, error } = await supabase
      .from('user_questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }

    return data || [];
  },

  // Get questions by user
  async getUserQuestions(userId: string): Promise<UserQuestion[]> {
    const { data, error } = await supabase
      .from('user_questions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user questions:', error);
      throw error;
    }

    return data || [];
  },

  // Get questions by status (for n8n processing)
  async getQuestionsByStatus(status: UserQuestion['status']): Promise<UserQuestion[]> {
    const { data, error } = await supabase
      .from('user_questions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching questions by status:', error);
      throw error;
    }

    return data || [];
  },

  // Update question status and solution
  async updateQuestion(
    id: string,
    updates: {
      status?: UserQuestion['status'];
      generated_solution?: string;
    }
  ): Promise<UserQuestion | null> {
    const { data, error } = await supabase
      .from('user_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating question:', error);
      throw error;
    }

    return data;
  },

  // Delete a question
  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('delete_question', {
        question_uuid: id
      });

      if (error) {
        console.error('Error calling delete_question function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete question');
      }

      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Get a specific question by ID
  async getQuestionById(id: string): Promise<UserQuestion | null> {
    const { data, error } = await supabase
      .from('user_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
      return null;
    }

    return data;
  },

  // Subscribe to question updates (real-time)
  subscribeToQuestionUpdates(
    questionId: string,
    callback: (question: UserQuestion) => void
  ) {
    return supabase
      .channel(`question-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_questions',
          filter: `id=eq.${questionId}`,
        },
        (payload) => {
          callback(payload.new as UserQuestion);
        }
      )
      .subscribe();
  },

  // Mark question as processing (for n8n)
  async markAsProcessing(questionId: string): Promise<UserQuestion | null> {
    return this.updateQuestion(questionId, { status: 'processing' });
  },

  // Mark question as failed (for n8n)
  async markAsFailed(questionId: string): Promise<UserQuestion | null> {
    return this.updateQuestion(questionId, { status: 'failed' });
  },
};

// n8n Integration helpers
export const n8nService = {
  // Get the upload endpoint URL
  getUploadEndpoint(): string {
    return `${supabaseUrl}/functions/v1/upload-solution`;
  },

  // Get API key for n8n (this should be set in your n8n environment)
  getApiKey(): string {
    return API_CONFIG.n8n.apiKey || 'configure-in-env-file';
  },

  // Upload solution from n8n (example usage)
  async uploadSolution(questionId: string, htmlContent: string, metadata?: any): Promise<boolean> {
    try {
      const response = await fetch(this.getUploadEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.getApiKey(),
        },
        body: JSON.stringify({
          questionId,
          htmlContent,
          metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Upload failed:', error);
        return false;
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  },
};