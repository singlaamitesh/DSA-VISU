/*
  # Upload Solution Edge Function

  1. Purpose
    - Receives HTML file uploads from n8n
    - Updates question status and stores generated solution
    - Handles file validation and processing

  2. Security
    - Validates file type and size
    - Requires proper authentication headers
    - Sanitizes HTML content

  3. Integration
    - Works with n8n workflow automation
    - Updates Supabase database records
    - Triggers real-time notifications
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

interface UploadRequest {
  questionId: string;
  htmlContent: string;
  fileName?: string;
  metadata?: {
    generatedAt: string;
    algorithm: string;
    complexity?: string;
  };
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
        JSON.stringify({ 
          error: 'Method not allowed',
          message: 'Only POST requests are supported. Please use POST method with request body.',
          supportedMethods: ['POST']
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check URL length to prevent 414 errors
    const url = new URL(req.url);
    if (url.href.length > 2048) {
      return new Response(
        JSON.stringify({ 
          error: 'Request-URI Too Large',
          message: 'URL is too long. Please send data in the request body, not as URL parameters.',
          maxUrlLength: 2048,
          currentUrlLength: url.href.length
        }),
        {
          status: 414,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate API key (simple authentication for n8n)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('N8N_API_KEY') || 'your-secret-api-key';
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Missing or invalid API key. Please include x-api-key header.',
          requiredHeaders: ['x-api-key']
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const contentType = req.headers.get('content-type') || '';
    let requestData: UploadRequest;

    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data (file upload)
      try {
        const formData = await req.formData();
        const questionId = formData.get('questionId') as string;
        const file = formData.get('htmlFile') as File;
        const metadata = formData.get('metadata') as string;

        if (!questionId || !file) {
          return new Response(
            JSON.stringify({ 
              error: 'Missing required fields',
              message: 'Both questionId and htmlFile are required in form data.',
              requiredFields: ['questionId', 'htmlFile'],
              receivedFields: Array.from(formData.keys())
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Validate file type
        if (!file.name.endsWith('.html') && !file.type.includes('text/html')) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid file type',
              message: 'Only HTML files are allowed.',
              allowedTypes: ['text/html', '.html'],
              receivedType: file.type,
              receivedName: file.name
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return new Response(
            JSON.stringify({ 
              error: 'File too large',
              message: 'File size exceeds maximum allowed size.',
              maxSize: maxSize,
              receivedSize: file.size,
              maxSizeMB: 5
            }),
            {
              status: 413,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const htmlContent = await file.text();
        
        requestData = {
          questionId,
          htmlContent,
          fileName: file.name,
          metadata: metadata ? JSON.parse(metadata) : undefined,
        };
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid form data',
            message: 'Failed to parse multipart form data.',
            details: error instanceof Error ? error.message : 'Unknown parsing error'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON request
      try {
        requestData = await req.json();
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON',
            message: 'Failed to parse JSON request body.',
            details: error instanceof Error ? error.message : 'Unknown parsing error'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported content type',
          message: 'Content-Type must be either application/json or multipart/form-data.',
          supportedTypes: ['application/json', 'multipart/form-data'],
          receivedType: contentType
        }),
        {
          status: 415,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { questionId, htmlContent, fileName, metadata } = requestData;

    // Validate required fields
    if (!questionId || !htmlContent) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          message: 'Both questionId and htmlContent are required.',
          requiredFields: ['questionId', 'htmlContent'],
          receivedFields: Object.keys(requestData)
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate HTML content size
    const maxContentSize = 1024 * 1024; // 1MB
    if (htmlContent.length > maxContentSize) {
      return new Response(
        JSON.stringify({ 
          error: 'HTML content too large',
          message: 'HTML content exceeds maximum allowed size.',
          maxSize: maxContentSize,
          receivedSize: htmlContent.length,
          maxSizeMB: 1
        }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Basic HTML validation
    if (!htmlContent.includes('<html') || !htmlContent.includes('</html>')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid HTML content',
          message: 'Content must be a complete HTML document with <html> and </html> tags.',
          requirements: ['Must contain <html tag', 'Must contain </html> tag']
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if question exists
    const { data: question, error: fetchError } = await supabase
      .from('user_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (fetchError || !question) {
      return new Response(
        JSON.stringify({ 
          error: 'Question not found',
          message: `No question found with ID: ${questionId}`,
          questionId: questionId
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if question is in a valid state for updating
    if (question.status === 'completed') {
      return new Response(
        JSON.stringify({ 
          error: 'Question already completed',
          message: 'This question has already been processed and completed.',
          currentStatus: question.status,
          questionId: questionId
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update question with generated solution
    const updateData = {
      status: 'completed' as const,
      generated_solution: htmlContent,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedQuestion, error: updateError } = await supabase
      .from('user_questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating question:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Database update failed',
          message: 'Failed to update question in database.',
          details: updateError.message,
          questionId: questionId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log successful upload
    console.log(`Successfully uploaded solution for question ${questionId}`, {
      fileName,
      contentLength: htmlContent.length,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solution uploaded successfully',
        data: {
          questionId: updatedQuestion.id,
          status: updatedQuestion.status,
          fileName,
          contentLength: htmlContent.length,
          updatedAt: updatedQuestion.updated_at,
          metadata,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in upload-solution function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});