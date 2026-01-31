-- React Quiz Schema for PrepJS
-- Run this SQL in your Supabase SQL Editor to add React quiz support

-- Add React-specific columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS react_total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS react_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS react_current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS react_last_quiz_date TIMESTAMP WITH TIME ZONE;

-- React Quiz attempts table
CREATE TABLE IF NOT EXISTS react_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  questions JSONB NOT NULL,
  user_answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- React Topic performance table
CREATE TABLE IF NOT EXISTS react_topic_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_name)
);

-- Covered React sub-topics tracking table
CREATE TABLE IF NOT EXISTS covered_react_subtopics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  main_topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  covered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, main_topic, subtopic)
);

-- Add quiz_type column to revision_items to distinguish JS from React
ALTER TABLE revision_items ADD COLUMN IF NOT EXISTS quiz_type TEXT DEFAULT 'javascript';

-- Create indexes for React quiz tables
CREATE INDEX IF NOT EXISTS idx_react_quiz_attempts_user_id ON react_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_react_quiz_attempts_completed_at ON react_quiz_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_react_topic_performance_user_id ON react_topic_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_covered_react_subtopics_user_id ON covered_react_subtopics(user_id);

-- Row Level Security (RLS) policies for React tables
ALTER TABLE react_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE react_topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE covered_react_subtopics ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (single-user app)
CREATE POLICY "Allow all operations on react_quiz_attempts" ON react_quiz_attempts FOR ALL USING (true);
CREATE POLICY "Allow all operations on react_topic_performance" ON react_topic_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations on covered_react_subtopics" ON covered_react_subtopics FOR ALL USING (true);

-- React Achievements (can add to existing achievements table with react_ prefix)
-- The achievement_type column already supports any string, so we just use 'react_' prefixed types
