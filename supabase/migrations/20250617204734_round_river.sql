/*
  # Add Delete Functionality for Questions

  1. Purpose
    - Add function to safely delete questions
    - Add RLS policy for delete operations
    - Ensure proper permissions for admin users

  2. Security
    - Only authenticated users can delete
    - Service role has full delete access
    - Proper error handling and logging

  3. Function
    - delete_question: Safely delete a question by ID
    - Returns success/error status
*/

-- Create a function to safely delete questions
CREATE OR REPLACE FUNCTION delete_question(question_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    deleted_count INTEGER;
    question_data RECORD;
BEGIN
    -- Get question data before deletion for logging
    SELECT * INTO question_data FROM user_questions WHERE id = question_uuid;
    
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
    RAISE LOG 'Question deleted: ID=%, Status=%, User=%', 
        question_uuid, question_data.status, COALESCE(question_data.user_email, 'anonymous');
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Question deleted successfully',
        'question_id', question_uuid,
        'deleted_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for delete operations
CREATE POLICY "Authenticated users can delete questions"
  ON user_questions
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions for the delete function
GRANT EXECUTE ON FUNCTION delete_question(UUID) TO authenticated, service_role;

-- Add helpful comment
COMMENT ON FUNCTION delete_question(UUID) IS 'Safely delete a question by ID. Only available to authenticated users.';