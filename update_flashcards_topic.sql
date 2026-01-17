-- Add topic column to flashcards table
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'General';

-- Create index for faster filtering/grouping by topic
CREATE INDEX IF NOT EXISTS idx_flashcards_topic ON flashcards(topic);
