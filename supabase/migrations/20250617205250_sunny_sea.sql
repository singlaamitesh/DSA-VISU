/*
  # Add delete question functionality

  1. Purpose
    - Create delete_question function for safe question deletion
    - Add proper RLS policy for delete operations (if not exists)
    - Grant appropriate permissions

  2. Security
    - Only authenticated users can delete questions
    - Function includes proper error handling and logging
    - Returns structured JSON response

  3. Functionality
    - Checks if question exists before deletion
    - Logs deletion for audit trail
    - Returns success/error status
*/

-- Create a function to delete questions
CREATE OR REPLACE FUNCTION delete_question(question_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    deleted_count INTEGER;
    question_record RECORD;
BEGIN
    -- First check if question exists and get details
    SELECT * INTO question_record FROM user_questions WHERE id = question_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Question not found',
            'question_id', question_uuid
        );
    END IF;
    
    -- Delete the question
    DELETE FROM user_questions WHERE id = question_uuid;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Failed to delete question',
            'question_id', question_uuid
        );
    END IF;
    
    -- Log the deletion
    RAISE LOG 'Question deleted: ID=%, User=%', 
        question_uuid, COALESCE(question_record.user_email, 'anonymous');
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Question deleted successfully',
        'question_id', question_uuid,
        'deleted_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the delete function
GRANT EXECUTE ON FUNCTION delete_question(UUID) TO authenticated, service_role;

-- Add RLS policy for delete operations (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_questions' 
        AND policyname = 'Authenticated users can delete questions'
    ) THEN
        CREATE POLICY "Authenticated users can delete questions"
          ON user_questions
          FOR DELETE
          TO authenticated
          USING (true);
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION delete_question(UUID) IS 'Safely delete a question by ID. Returns success/error status.';