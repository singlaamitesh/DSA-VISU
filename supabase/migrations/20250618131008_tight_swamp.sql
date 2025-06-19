/*
  # Add Language Preferences to Algorhythm

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `preferred_language` (text, programming language preference)
      - `theme` (text, UI theme preference)
      - `notification_preferences` (jsonb, notification settings)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Updates
    - Add `preferred_language` column to `user_questions` table
    - Update `get_pending_questions` function to include language data

  3. Security
    - Enable RLS on `user_preferences` table
    - Add policies for user access control
    - Grant appropriate permissions

  4. Functions
    - `get_or_create_user_preferences` - Auto-create user preferences
    - `update_user_language` - Update language preference with validation
    - `get_user_language` - Get user's preferred language
    - Updated `get_pending_questions` - Include language preferences

  5. Monitoring
    - `language_usage_stats` view for analytics
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  preferred_language text DEFAULT 'javascript' CHECK (preferred_language IN (
    'javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'
  )),
  theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  notification_preferences jsonb DEFAULT '{"email": true, "browser": true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add preferred_language column to user_questions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_questions' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE user_questions ADD COLUMN preferred_language text DEFAULT 'javascript' CHECK (preferred_language IN (
      'javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'
    ));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can read their own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to preferences"
  ON user_preferences
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_language ON user_questions(preferred_language);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(target_user_id uuid)
RETURNS user_preferences AS $$
DECLARE
  user_prefs user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO user_prefs FROM user_preferences WHERE user_id = target_user_id;
  
  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id, preferred_language, theme)
    VALUES (target_user_id, 'javascript', 'dark')
    RETURNING * INTO user_prefs;
  END IF;
  
  RETURN user_prefs;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user language preference
CREATE OR REPLACE FUNCTION update_user_language(target_user_id uuid, new_language text)
RETURNS JSONB AS $$
DECLARE
  valid_languages text[] := ARRAY['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'typescript'];
  updated_count INTEGER;
BEGIN
  -- Validate language
  IF NOT (new_language = ANY(valid_languages)) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid language. Must be one of: ' || array_to_string(valid_languages, ', '),
      'valid_languages', valid_languages
    );
  END IF;
  
  -- Update or insert preferences
  INSERT INTO user_preferences (user_id, preferred_language)
  VALUES (target_user_id, new_language)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    preferred_language = new_language,
    updated_at = now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update language preference'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Language preference updated successfully',
    'user_id', target_user_id,
    'preferred_language', new_language,
    'updated_at', now()
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's preferred language
CREATE OR REPLACE FUNCTION get_user_language(target_user_id uuid)
RETURNS text AS $$
DECLARE
  user_lang text;
BEGIN
  SELECT preferred_language INTO user_lang 
  FROM user_preferences 
  WHERE user_id = target_user_id;
  
  -- Return default if not found
  RETURN COALESCE(user_lang, 'javascript');
END;
$$ LANGUAGE plpgsql;

-- Drop the existing get_pending_questions function to avoid signature conflicts
DROP FUNCTION IF EXISTS get_pending_questions(INTEGER);

-- Create the updated get_pending_questions function with language preferences
CREATE OR REPLACE FUNCTION get_pending_questions(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    question TEXT,
    user_email TEXT,
    user_name TEXT,
    user_id UUID,
    preferred_language TEXT,
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
        COALESCE(uq.preferred_language, up.preferred_language, 'javascript') as preferred_language,
        uq.created_at,
        uq.updated_at
    FROM user_questions uq
    LEFT JOIN user_preferences up ON uq.user_id = up.user_id
    WHERE uq.status = 'pending'
    ORDER BY uq.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION get_or_create_user_preferences(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_user_language(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_language(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_pending_questions(INTEGER) TO authenticated, service_role, anon;

-- Create a view for language statistics (fix ambiguous column reference)
CREATE OR REPLACE VIEW language_usage_stats AS
SELECT 
    up.preferred_language,
    COUNT(DISTINCT up.user_id) as user_count,
    COUNT(uq.id) as question_count,
    AVG(EXTRACT(EPOCH FROM (uq.updated_at - uq.created_at))) as avg_processing_time_seconds
FROM user_preferences up
LEFT JOIN user_questions uq ON up.user_id = uq.user_id
GROUP BY up.preferred_language
ORDER BY user_count DESC;

-- Grant access to the view
GRANT SELECT ON language_usage_stats TO authenticated, service_role;

-- Add helpful comments
COMMENT ON TABLE user_preferences IS 'Stores user preferences including programming language, theme, and notification settings';
COMMENT ON FUNCTION get_or_create_user_preferences(uuid) IS 'Gets existing user preferences or creates default ones if not found';
COMMENT ON FUNCTION update_user_language(uuid, text) IS 'Updates user preferred programming language with validation';
COMMENT ON FUNCTION get_user_language(uuid) IS 'Gets user preferred language, returns javascript as default';
COMMENT ON VIEW language_usage_stats IS 'Statistics about programming language preferences and usage';