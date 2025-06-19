/*
  # Add Database Trigger for n8n Automation

  1. Purpose
    - Automatically triggers n8n workflow when new questions are inserted
    - Calls the trigger-n8n edge function via HTTP request
    - Ensures all new questions are processed automatically

  2. Trigger Logic
    - Fires AFTER INSERT on user_questions table
    - Only triggers for questions with 'pending' status
    - Makes HTTP request to edge function

  3. Error Handling
    - Logs errors but doesn't fail the insert operation
    - Allows manual reprocessing if automatic trigger fails
*/

-- Create a function to trigger n8n workflow
CREATE OR REPLACE FUNCTION trigger_n8n_workflow()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
    payload JSONB;
    response TEXT;
BEGIN
    -- Only trigger for pending questions
    IF NEW.status = 'pending' THEN
        -- Get the edge function URL (you'll need to set this)
        webhook_url := current_setting('app.n8n_trigger_url', true);
        
        -- If webhook URL is not configured, log and continue
        IF webhook_url IS NULL OR webhook_url = '' THEN
            RAISE LOG 'n8n trigger URL not configured in app.n8n_trigger_url setting';
            RETURN NEW;
        END IF;
        
        -- Prepare payload
        payload := jsonb_build_object(
            'questionId', NEW.id,
            'action', 'new_question'
        );
        
        -- Make HTTP request to trigger n8n (using pg_net extension if available)
        -- Note: This requires the pg_net extension to be enabled
        BEGIN
            SELECT net.http_post(
                url := webhook_url,
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := payload
            ) INTO response;
            
            RAISE LOG 'Successfully triggered n8n workflow for question %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the insert
            RAISE LOG 'Failed to trigger n8n workflow for question %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_n8n_on_new_question ON user_questions;
CREATE TRIGGER trigger_n8n_on_new_question
    AFTER INSERT ON user_questions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_n8n_workflow();

-- Set the trigger URL (replace with your actual edge function URL)
-- You'll need to update this with your actual Supabase project URL
-- ALTER DATABASE postgres SET app.n8n_trigger_url = 'https://your-project.supabase.co/functions/v1/trigger-n8n';

-- Alternative: Create a simpler version that just logs (if pg_net is not available)
CREATE OR REPLACE FUNCTION log_new_question()
RETURNS TRIGGER AS $$
BEGIN
    -- Log new question for manual processing
    RAISE LOG 'New question created with ID: % - Status: %', NEW.id, NEW.status;
    
    -- You can also insert into a processing queue table
    -- INSERT INTO processing_queue (question_id, status, created_at) 
    -- VALUES (NEW.id, 'pending', NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a simple logging trigger as backup
DROP TRIGGER IF EXISTS log_new_question_trigger ON user_questions;
CREATE TRIGGER log_new_question_trigger
    AFTER INSERT ON user_questions
    FOR EACH ROW
    EXECUTE FUNCTION log_new_question();