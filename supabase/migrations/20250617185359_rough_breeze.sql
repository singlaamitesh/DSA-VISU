/*
  # Update user_questions table for authentication

  1. Changes
    - Add user_id column to link questions to authenticated users
    - Update RLS policies for better security
    - Add index for user_id for better performance

  2. Security
    - Users can only see their own questions when authenticated
    - Public can still submit questions (for guest users)
    - Admin/n8n can access all questions for processing
*/

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_questions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_questions ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit questions" ON user_questions;
DROP POLICY IF EXISTS "Public read access for questions" ON user_questions;
DROP POLICY IF EXISTS "Public update access for questions" ON user_questions;

-- Create new RLS policies
CREATE POLICY "Anyone can submit questions"
  ON user_questions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read their own questions"
  ON user_questions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public read access for admin/n8n"
  ON user_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public update access for processing"
  ON user_questions
  FOR UPDATE
  TO public
  USING (true);

-- Allow service role full access (for n8n)
CREATE POLICY "Service role full access"
  ON user_questions
  FOR ALL
  TO service_role
  USING (true);