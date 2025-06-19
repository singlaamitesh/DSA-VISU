/*
  # Trigger n8n Workflow Edge Function

  1. Purpose
    - Automatically triggers n8n workflow when new questions are created
    - Can be called from database triggers or application code
    - Sends question data to n8n webhook

  2. Usage
    - Called automatically when new questions are inserted
    - Can also be called manually for reprocessing
    - Handles webhook authentication and error handling

  3. Integration
    - Works with Supabase database triggers
    - Calls n8n webhook endpoint
    - Logs all trigger attempts for debugging
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

interface TriggerRequest {
  questionId: string;
  action?: 'new_question' | 'reprocess';
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { questionId, action = 'new_question' }: TriggerRequest = await req.json();

    if (!questionId) {
      return new Response(
        JSON.stringify({ error: 'Missing questionId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get question details from database
    const { data: question, error: fetchError } = await supabase
      .from('user_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (fetchError || !question) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Only process pending questions (unless it's a reprocess action)
    if (question.status !== 'pending' && action !== 'reprocess') {
      return new Response(
        JSON.stringify({ 
          message: 'Question already processed or in progress',
          status: question.status 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update question status to processing
    await supabase
      .from('user_questions')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId);

    // Get n8n webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL environment variable not set');
      
      // Revert status back to pending
      await supabase
        .from('user_questions')
        .update({ status: 'pending' })
        .eq('id', questionId);
        
      return new Response(
        JSON.stringify({ error: 'n8n webhook URL not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare payload for n8n
    const n8nPayload = {
      questionId: question.id,
      question: question.question,
      userEmail: question.user_email,
      userName: question.user_name,
      userId: question.user_id,
      createdAt: question.created_at,
      action: action,
      timestamp: new Date().toISOString()
    };

    // Trigger n8n workflow
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!n8nResponse.ok) {
      console.error('Failed to trigger n8n workflow:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        questionId: questionId
      });

      // Revert status back to pending on failure
      await supabase
        .from('user_questions')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to trigger n8n workflow',
          details: `HTTP ${n8nResponse.status}: ${n8nResponse.statusText}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const n8nResult = await n8nResponse.json();

    console.log('Successfully triggered n8n workflow:', {
      questionId: questionId,
      n8nResponse: n8nResult,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'n8n workflow triggered successfully',
        data: {
          questionId: questionId,
          status: 'processing',
          n8nResponse: n8nResult,
          triggeredAt: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in trigger-n8n function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});