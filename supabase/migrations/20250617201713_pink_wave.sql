/*
  # Fix Missing Database Functions

  1. Purpose
    - Create the missing get_question_stats function
    - Ensure all required functions exist for the application
    - Fix any permission issues

  2. Functions Created
    - get_question_stats() - Returns statistics about questions
    - Ensures proper permissions are granted

  3. Security
    - Grants appropriate access to authenticated users
    - Maintains existing RLS policies
*/

-- Create the missing get_question_stats function
CREATE OR REPLACE FUNCTION get_question_stats()
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

-- Ensure all functions have proper permissions
GRANT EXECUTE ON FUNCTION get_question_stats() TO authenticated, service_role, anon;

-- Verify other required functions exist and have permissions
DO $$
BEGIN
    -- Check if get_pending_questions exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_pending_questions'
    ) THEN
        CREATE FUNCTION get_pending_questions(limit_count INTEGER DEFAULT 10)
        RETURNS TABLE (
            id UUID,
            question TEXT,
            user_email TEXT,
            user_name TEXT,
            user_id UUID,
            created_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ
        ) AS $func$
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
        $func$ LANGUAGE plpgsql;
        
        GRANT EXECUTE ON FUNCTION get_pending_questions(INTEGER) TO authenticated, service_role, anon;
    END IF;
    
    -- Check if reset_question_status exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'reset_question_status'
    ) THEN
        CREATE FUNCTION reset_question_status(question_uuid UUID, new_status TEXT DEFAULT 'pending')
        RETURNS JSONB AS $func$
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
        $func$ LANGUAGE plpgsql;
        
        GRANT EXECUTE ON FUNCTION reset_question_status(UUID, TEXT) TO authenticated, service_role;
    END IF;
END $$;

-- Add helpful comments for documentation
COMMENT ON FUNCTION get_question_stats() IS 'Returns comprehensive statistics about all questions in the system';

-- Log successful migration
DO $$
BEGIN
    RAISE LOG 'Successfully created missing database functions for Algorhythm application';
END $$;