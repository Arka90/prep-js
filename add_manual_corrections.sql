-- Add manual_corrections column to quiz_attempts table
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS manual_corrections JSONB DEFAULT '[]'::jsonb;
