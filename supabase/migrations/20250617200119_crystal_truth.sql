/*
  # Fix n8n Integration - Clean Migration

  1. Database Functions
    - Remove problematic HTTP trigger functions
    - Add simple logging and manual trigger functions
    - Create utility functions for n8n polling approach

  2. Triggers
    - Clean up existing triggers properly
    - Create new logging trigger safely
    - Maintain updated_at functionality

  3. Performance
    - Add indexes for pending questions
    - Update monitoring view
    - Grant proper permissions
*/

-- Clean up existing triggers and functions safely
DROP TRIGGER IF EXISTS trigger_n8n_on_new_question ON user_questions;
DROP TRIGGER IF EXISTS log_new_question_trigger ON user_questions;
DROP FUNCTION IF EXISTS trigger_n8n_workflow();
DROP FUNCTION IF EXISTS log_new_question();

-- Create a simple logging function for new questions
CREATE OR REPLACE FUNCTION log_new_question()
RETURNS TRIGGER AS $$
BEGIN
    -- Log new question creation
    RAISE LOG 'New question created: ID=%, Status=%, Question=%', 
        NEW.id, NEW.status, LEFT(NEW.question, 100);
    
    -- Set initial status to pending if not already set
    IF NEW.status IS NULL THEN
        NEW.status := 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging new questions
CREATE TRIGGER log_new_question_trigger
    BEFORE INSERT ON user_questions
    FOR EACH ROW
    EXECUTE FUNCTION log_new_question();

-- Create a function to manually trigger n8n workflow (for admin use)
CREATE OR REPLACE FUNCTION trigger_n8n_manual(question_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    question_record RECORD;
BEGIN
    -- Get question details
    SELECT * INTO question_record FROM user_questions WHERE id = question_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found',
            'question_id', question_uuid
        );
    END IF;
    
    -- Update status to processing
    UPDATE user_questions 
    SET status = 'processing', updated_at = NOW() 
    WHERE id = question_uuid;
    
    -- Return question data for manual processing
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Question marked for processing',
        'question_id', question_uuid,
        'question', question_record.question,
        'user_email', question_record.user_email,
        'user_name', question_record.user_name,
        'created_at', question_record.created_at
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset question status
CREATE OR REPLACE FUNCTION reset_question_status(question_uuid UUID, new_status TEXT DEFAULT 'pending')
RETURNS JSONB AS $$
DECLARE
    valid_statuses TEXT[] := ARRAY['pending', 'processing', 'completed', 'failed'];
BEGIN
    -- Validate status
    IF NOT (new_status = ANY(valid_statuses)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status. Must be one of: pending, processing, completed, failed'
        );
    END IF;
    
    -- Update question status
    UPDATE user_questions 
    SET status = new_status, updated_at = NOW() 
    WHERE id = question_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Status updated successfully',
        'question_id', question_uuid,
        'new_status', new_status
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get pending questions (for n8n polling)
CREATE OR REPLACE FUNCTION get_pending_questions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    question TEXT,
    user_email TEXT,
    user_name TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uq.id,
        uq.question,
        uq.user_email,
        uq.user_name,
        uq.user_id,
        uq.created_at
    FROM user_questions uq
    WHERE uq.status = 'pending'
    ORDER BY uq.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark question as processing
CREATE OR REPLACE FUNCTION mark_question_processing(question_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    UPDATE user_questions 
    SET status = 'processing', updated_at = NOW() 
    WHERE id = question_uuid AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found or not in pending status'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Question marked as processing',
        'question_id', question_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Ensure the updated_at trigger function exists and is current
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safely recreate the updated_at trigger
DROP TRIGGER IF EXISTS update_user_questions_updated_at ON user_questions;
CREATE TRIGGER update_user_questions_updated_at
    BEFORE UPDATE ON user_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION trigger_n8n_manual(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reset_question_status(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_pending_questions(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_question_processing(UUID) TO authenticated, service_role;

-- Create indexes for better performance (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_questions_status_created'
    ) THEN
        CREATE INDEX idx_user_questions_status_created 
        ON user_questions (status, created_at) 
        WHERE status IN ('pending', 'processing');
    END IF;
END $$;

-- Safely update the monitoring view
DROP VIEW IF EXISTS n8n_integration_status;
CREATE VIEW n8n_integration_status AS
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

-- Grant access to the view
GRANT SELECT ON n8n_integration_status TO authenticated, service_role;