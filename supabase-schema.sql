-- PrepJS Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_quiz_date TIMESTAMP WITH TIME ZONE
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
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

-- Topic performance table
CREATE TABLE IF NOT EXISTS topic_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_name)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON quiz_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_performance_user_id ON topic_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (single-user app)
-- In production, you may want more restrictive policies
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on quiz_attempts" ON quiz_attempts FOR ALL USING (true);
CREATE POLICY "Allow all operations on topic_performance" ON topic_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations on achievements" ON achievements FOR ALL USING (true);

-- Insert a default user with a hashed access key
-- The default access key is: "prepjs2024" 
-- This is the bcrypt hash of "prepjs2024"
-- You should change this to your own secure key!
INSERT INTO users (access_key, current_streak, total_points, level)
VALUES (
  '$2a$10$rQEY7QYmG8vH0xJ2zWQZQeKXmO7bNqW8hO9xR5vT6yA3zL1oP4cI6',
  0,
  0,
  1
) ON CONFLICT DO NOTHING;

-- To generate a new hashed password, you can use this Node.js code:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('your-secret-key', 10);
-- console.log(hash);
