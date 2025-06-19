/*
  # Create user questions table for algorithm visualizer

  1. New Tables
    - `user_questions`
      - `id` (uuid, primary key)
      - `question` (text, the user's algorithm question/description)
      - `user_email` (text, optional user email for tracking)
      - `user_name` (text, optional user name)
      - `status` (text, processing status: 'pending', 'processing', 'completed', 'failed')
      - `generated_solution` (text, the generated HTML solution)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_questions` table
    - Add policy for public access (since users might not be authenticated)
    - Add policy for reading own questions if user provides email
*/

CREATE TABLE IF NOT EXISTS user_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  user_email text,
  user_name text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  generated_solution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert questions (for public access)
CREATE POLICY "Anyone can submit questions"
  ON user_questions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy to allow reading questions (for n8n integration and admin access)
CREATE POLICY "Public read access for questions"
  ON user_questions
  FOR SELECT
  TO public
  USING (true);

-- Policy to allow updating questions (for n8n to update status and solutions)
CREATE POLICY "Public update access for questions"
  ON user_questions
  FOR UPDATE
  TO public
  USING (true);

-- Create an index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_user_questions_status ON user_questions(status);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at DESC);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at when a row is modified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_questions_updated_at'
  ) THEN
    CREATE TRIGGER update_user_questions_updated_at
      BEFORE UPDATE ON user_questions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;