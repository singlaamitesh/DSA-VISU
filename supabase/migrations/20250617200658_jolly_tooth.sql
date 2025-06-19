/*
  # Fix Function Drops and Remove Webhook Triggers

  1. Purpose
    - Remove all webhook trigger functionality
    - Create simple polling-based functions for n8n
    - Fix function signature conflicts

  2. Changes
    - Drop all existing functions properly
    - Create new functions with correct signatures
    - Remove HTTP trigger dependencies
    - Add polling support functions

  3. Security
    - Maintain RLS policies
    - Grant appropriate permissions
    - Add logging for debugging
*/

-- Remove all existing triggers and functions that make HTTP calls
DROP TRIGGER IF EXISTS trigger_n8n_on_new_question ON user_questions;
DROP TRIGGER IF EXISTS log_new_question_trigger ON user_questions;
DROP TRIGGER IF EXISTS initialize_question_trigger ON user_questions;

-- Drop all existing functions with proper signatures
DROP FUNCTION IF EXISTS trigger_n8n_workflow();
DROP FUNCTION IF EXISTS log_new_question();
DROP FUNCTION IF EXISTS manual_trigger_n8n(UUID);
DROP FUNCTION IF EXISTS retry_failed_questions();
DROP FUNCTION IF EXISTS trigger_n8n_manual(UUID);
DROP FUNCTION IF EXISTS initialize_question();

-- Drop the existing get_pending_questions function with any signature
DROP FUNCTION IF EXISTS get_pending_questions(INTEGER);
DROP FUNCTION IF EXISTS get_pending_questions();

-- Drop other potentially conflicting functions
DROP FUNCTION IF EXISTS mark_question_processing(UUID);
DROP FUNCTION IF EXISTS mark_question_completed(UUID, TEXT);
DROP FUNCTION IF EXISTS mark_question_failed(UUID, TEXT);
DROP FUNCTION IF EXISTS reset_question_status(UUID, TEXT);
DROP FUNCTION IF EXISTS reset_question_status(UUID);
DROP FUNCTION IF EXISTS get_question_stats();

-- Create a simple function to ensure proper question initialization
CREATE OR REPLACE FUNCTION initialize_question()
RETURNS TRIGGER AS $$
BEGIN
    -- Set initial status to pending if not already set
    IF NEW.status IS NULL THEN
        NEW.status := 'pending';
    END IF;
    
    -- Set created_at if not set
    IF NEW.created_at IS NULL THEN
        NEW.created_at := NOW();
    END IF;
    
    -- Set updated_at
    NEW.updated_at := NOW();
    
    -- Log the creation (for debugging)
    RAISE LOG 'Question created: ID=%, Status=%, User=%', 
        NEW.id, NEW.status, COALESCE(NEW.user_email, 'anonymous');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for question initialization
CREATE TRIGGER initialize_question_trigger
    BEFORE INSERT ON user_questions
    FOR EACH ROW
    EXECUTE FUNCTION initialize_question();

-- Create a function to get pending questions (for n8n polling)
CREATE FUNCTION get_pending_questions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    question TEXT,
    user_email TEXT,
    user_name TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uq.id,
        uq.question,
        uq.user_email,
        uq.user_name,
        uq.user_id,
        uq.created_at,
        uq.updated_at
    FROM user_questions uq
    WHERE uq.status = 'pending'
    ORDER BY uq.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark question as processing
CREATE FUNCTION mark_question_processing(question_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_questions 
    SET status = 'processing', updated_at = NOW() 
    WHERE id = question_uuid AND status = 'pending';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found or not in pending status',
            'question_id', question_uuid
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Question marked as processing',
        'question_id', question_uuid,
        'updated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark question as completed
CREATE FUNCTION mark_question_completed(question_uuid UUID, solution_html TEXT)
RETURNS JSONB AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_questions 
    SET 
        status = 'completed',
        generated_solution = solution_html,
        updated_at = NOW() 
    WHERE id = question_uuid AND status = 'processing';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found or not in processing status',
            'question_id', question_uuid
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Question marked as completed',
        'question_id', question_uuid,
        'updated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to mark question as failed
CREATE FUNCTION mark_question_failed(question_uuid UUID, error_message TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_questions 
    SET 
        status = 'failed',
        updated_at = NOW() 
    WHERE id = question_uuid AND status IN ('pending', 'processing');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found or already completed',
            'question_id', question_uuid
        );
    END IF;
    
    -- Log the failure
    IF error_message IS NOT NULL THEN
        RAISE LOG 'Question % marked as failed: %', question_uuid, error_message;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Question marked as failed',
        'question_id', question_uuid,
        'error_message', error_message,
        'updated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset question status (admin use)
CREATE FUNCTION reset_question_status(question_uuid UUID, new_status TEXT DEFAULT 'pending')
RETURNS JSONB AS $$
DECLARE
    valid_statuses TEXT[] := ARRAY['pending', 'processing', 'completed', 'failed'];
    updated_count INTEGER;
BEGIN
    -- Validate status
    IF NOT (new_status = ANY(valid_statuses)) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status. Must be one of: pending, processing, completed, failed',
            'valid_statuses', valid_statuses
        );
    END IF;
    
    -- Update question status
    UPDATE user_questions 
    SET status = new_status, updated_at = NOW() 
    WHERE id = question_uuid;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found',
            'question_id', question_uuid
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Status updated successfully',
        'question_id', question_uuid,
        'new_status', new_status,
        'updated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get question statistics
CREATE FUNCTION get_question_stats()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'processing', COUNT(*) FILTER (WHERE status = 'processing'),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'last_24h', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
        'oldest_pending', MIN(created_at) FILTER (WHERE status = 'pending'),
        'latest_completed', MAX(updated_at) FILTER (WHERE status = 'completed')
    ) INTO stats
    FROM user_questions;
    
    RETURN stats;
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
GRANT EXECUTE ON FUNCTION get_pending_questions(INTEGER) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION mark_question_processing(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_question_completed(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_question_failed(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reset_question_status(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_question_stats() TO authenticated, service_role;

-- Create optimized indexes for n8n polling
DROP INDEX IF EXISTS idx_user_questions_status_created;
CREATE INDEX idx_user_questions_status_created 
ON user_questions (status, created_at) 
WHERE status IN ('pending', 'processing');

-- Create index for user questions lookup
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id_status 
ON user_questions (user_id, status, created_at DESC);

-- Update the monitoring view to be more comprehensive
DROP VIEW IF EXISTS n8n_integration_status;
CREATE VIEW n8n_integration_status AS
SELECT 
    status,
    COUNT(*) as count,
    MAX(created_at) as latest_question,
    MIN(created_at) as oldest_question,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM user_questions 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'pending' THEN 1
        WHEN 'processing' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'failed' THEN 4
        ELSE 5
    END;

-- Create a view for n8n polling endpoint
DROP VIEW IF EXISTS n8n_pending_queue;
CREATE VIEW n8n_pending_queue AS
SELECT 
    id,
    question,
    user_email,
    user_name,
    user_id,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as age_seconds
FROM user_questions 
WHERE status = 'pending'
ORDER BY created_at ASC;

-- Grant access to the views
GRANT SELECT ON n8n_integration_status TO authenticated, service_role, anon;
GRANT SELECT ON n8n_pending_queue TO authenticated, service_role, anon;

-- Add helpful comments
COMMENT ON FUNCTION get_pending_questions(INTEGER) IS 'Get pending questions for n8n polling. Use this in your n8n workflow to fetch questions to process.';
COMMENT ON FUNCTION mark_question_processing(UUID) IS 'Mark a question as processing. Call this when n8n starts processing a question.';
COMMENT ON FUNCTION mark_question_completed(UUID, TEXT) IS 'Mark a question as completed with the generated HTML solution.';
COMMENT ON FUNCTION mark_question_failed(UUID, TEXT) IS 'Mark a question as failed with optional error message.';
COMMENT ON VIEW n8n_pending_queue IS 'View of all pending questions for n8n polling. Ordered by creation time.';