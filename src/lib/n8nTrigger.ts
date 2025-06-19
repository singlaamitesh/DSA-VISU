// n8n integration service for Algorhythm
// Uses polling-based approach for better reliability

import { questionService } from './supabase';
import { API_CONFIG } from '../config/constants';

export const n8nTriggerService = {
  // Get n8n webhook URL (for manual testing only)
  getWebhookUrl(): string {
    return API_CONFIG.n8n.webhookUrl || 'configure-in-env-file';
  },

  // Check if n8n integration is configured (for display purposes)
  isConfigured(): boolean {
    const webhookUrl = API_CONFIG.n8n.webhookUrl;
    return !!(webhookUrl && webhookUrl.startsWith('http') && !webhookUrl.includes('configure-in-env-file'));
  },

  // Check if running in development mode
  isDevelopment(): boolean {
    const webhookUrl = this.getWebhookUrl();
    return webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1');
  },

  // Get configuration status for display
  getConfigurationStatus(): {
    configured: boolean;
    webhookUrl: string;
    isDevelopment: boolean;
    mode: 'polling' | 'webhook';
    description: string;
  } {
    const webhookUrl = this.getWebhookUrl();
    const configured = this.isConfigured();
    const isDevelopment = this.isDevelopment();
    
    return {
      configured,
      webhookUrl,
      isDevelopment,
      mode: 'polling',
      description: configured 
        ? 'n8n will poll the database for new questions automatically'
        : 'Configure VITE_N8N_WEBHOOK_URL to enable n8n integration'
    };
  },

  // Manual trigger for admin use (calls Supabase edge function)
  async triggerWorkflow(questionId: string, action: 'new_question' | 'reprocess' = 'new_question') {
    try {
      // For polling-based approach, we just reset the question status
      // n8n will pick it up on the next poll
      const response = await fetch(`${API_CONFIG.supabase.url}/rest/v1/rpc/reset_question_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.supabase.anonKey}`,
          'apikey': API_CONFIG.supabase.anonKey,
        },
        body: JSON.stringify({
          question_uuid: questionId,
          new_status: 'pending'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset question status');
      }

      return {
        success: true,
        message: `Question reset to pending status. n8n will process it on the next poll.`,
        data: result
      };
    } catch (error) {
      console.error('Error resetting question status:', error);
      throw error;
    }
  },

  // Test webhook connectivity (for development/testing)
  async testWebhook(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const webhookUrl = this.getWebhookUrl();
      
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        return {
          success: false,
          message: 'Webhook URL not configured or invalid'
        };
      }
      
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test webhook connectivity from Algorhythm'
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      if (response.ok) {
        const result = await response.text();
        return {
          success: true,
          message: 'Webhook is reachable',
          details: { status: response.status, response: result }
        };
      } else {
        return {
          success: false,
          message: `Webhook returned error: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to reach webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  },

  // Get pending questions count (for admin dashboard)
  async getPendingCount(): Promise<number> {
    try {
      const pendingQuestions = await questionService.getQuestionsByStatus('pending');
      return pendingQuestions.length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }
};