/*
  # Configure n8n automation trigger

  1. Purpose
    - Set up automatic n8n workflow triggering for new questions
    - Create trigger function that calls edge function
    - Enable HTTP requests from database triggers

  2. Changes
    - Enable pg_net extension for HTTP requests
    - Create/update trigger function for n8n workflow
    - Set up trigger on user_questions table
    - Add manual trigger function for admin use

  3. Security
    - Uses edge function as intermediary for n8n calls
    - Proper error handling and logging
    - No direct external HTTP calls from database
*/

-- Enable the pg_net extension for HTTP requests (if not already enabled)
-- This allows database triggers to make HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create or update the trigger function to call our edge function
CREATE OR REPLACE FUNCTION trigger_n8n_workflow()
RETURNS TRIGGER AS $$
DECLARE
    edge_function_url TEXT;
    payload JSONB;
    response_id BIGINT;
    supabase_url TEXT;
BEGIN
    -- Only trigger for new pending questions
    IF NEW.status = 'pending' AND (TG_OP = 'INSERT' OR OLD.status != 'pending') THEN
        -- Construct the edge function URL
        -- Note: In production, this should be your actual Supabase project URL
        supabase_url := 'https://iorahprsayckpcaufrfo.supabase.co';
        edge_function_url := supabase_url || '/functions/v1/trigger-n8n';
        
        -- Prepare payload for the edge function
        payload := jsonb_build_object(
            'questionId', NEW.id,
            'question', NEW.question,
            'action', 'new_question',
            'timestamp', NOW()
        );
        
        -- Make HTTP request to edge function (which will trigger n8n)
        BEGIN
            -- Update question status to processing first
            UPDATE user_questions 
            SET status = 'processing', updated_at = NOW() 
            WHERE id = NEW.id;
            
            -- Call the edge function
            SELECT net.http_post(
                url := edge_function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'x-trigger-source', 'database'
                ),
                body := payload
            ) INTO response_id;
            
            RAISE LOG 'Successfully triggered n8n workflow for question % (response_id: %)', NEW.id, response_id;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error and mark question as failed
            RAISE LOG 'Failed to trigger n8n workflow for question %: %', NEW.id, SQLERRM;
            
            -- Update status to failed so it can be retried
            UPDATE user_questions 
            SET status = 'failed', updated_at = NOW() 
            WHERE id = NEW.id;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trigger_n8n_on_new_question ON user_questions;
CREATE TRIGGER trigger_n8n_on_new_question
    AFTER INSERT ON user_questions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_n8n_workflow();

-- Create a manual trigger function for admin use
CREATE OR REPLACE FUNCTION manual_trigger_n8n(question_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    edge_function_url TEXT;
    payload JSONB;
    response_id BIGINT;
    question_record RECORD;
    supabase_url TEXT;
BEGIN
    -- Get question details
    SELECT * INTO question_record FROM user_questions WHERE id = question_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Question not found');
    END IF;
    
    -- Construct the edge function URL
    supabase_url := 'https://iorahprsayckpcaufrfo.supabase.co';
    edge_function_url := supabase_url || '/functions/v1/trigger-n8n';
    
    -- Prepare payload
    payload := jsonb_build_object(
        'questionId', question_uuid,
        'question', question_record.question,
        'action', 'reprocess',
        'timestamp', NOW()
    );
    
    -- Update status to processing
    UPDATE user_questions 
    SET status = 'processing', updated_at = NOW() 
    WHERE id = question_uuid;
    
    -- Make HTTP request
    BEGIN
        SELECT net.http_post(
            url := edge_function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-trigger-source', 'manual'
            ),
            body := payload
        ) INTO response_id;
        
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Workflow triggered successfully',
            'response_id', response_id,
            'question_id', question_uuid
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Reset status back to failed
        UPDATE user_questions 
        SET status = 'failed', updated_at = NOW() 
        WHERE id = question_uuid;
        
        RETURN jsonb_build_object(
            'error', 'Failed to trigger workflow: ' || SQLERRM
        );
    END;
END;
$$ LANGUAGE plpgsql;

-- Create a function to retry failed questions
CREATE OR REPLACE FUNCTION retry_failed_questions()
RETURNS JSONB AS $$
DECLARE
    failed_question RECORD;
    result JSONB;
    retry_count INTEGER := 0;
BEGIN
    -- Get all failed questions from the last 24 hours
    FOR failed_question IN 
        SELECT id FROM user_questions 
        WHERE status = 'failed' 
        AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10
    LOOP
        -- Retry each failed question
        SELECT manual_trigger_n8n(failed_question.id) INTO result;
        retry_count := retry_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Retry completed',
        'questions_retried', retry_count
    );
END;
$$ LANGUAGE plpgsql;

-- Create a view for monitoring n8n integration status
CREATE OR REPLACE VIEW n8n_integration_status AS
SELECT 
    status,
    COUNT(*) as count,
    MAX(created_at) as latest_question,
    MIN(created_at) as oldest_question
FROM user_questions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'pending' THEN 1
        WHEN 'processing' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'failed' THEN 4
        ELSE 5
    END;

-- Grant necessary permissions for the functions
GRANT EXECUTE ON FUNCTION manual_trigger_n8n(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION retry_failed_questions() TO authenticated;
GRANT SELECT ON n8n_integration_status TO authenticated;