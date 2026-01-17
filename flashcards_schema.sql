-- Flashcards table for Adaptive Concept Damage Control
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Concept Cluster Info
  concept_name TEXT NOT NULL,
  concept_description TEXT,
  
  -- Card Content (JSON for flexibility)
  -- front: { trigger_code, question_text, ... }
  -- back: { explanation, correct_mental_model, ... }
  front_content JSONB NOT NULL,
  back_content JSONB NOT NULL,
  
  -- Metadata
  card_type TEXT CHECK (card_type IN ('misconception_breaker', 'prediction', 'contrast', 'edge_case')),
  
  -- Spaced Repetition / Status
  status TEXT CHECK (status IN ('new', 'reviewing', 'validated', 'mastered')) DEFAULT 'new',
  confidence_level INTEGER DEFAULT 0, -- 0 to 5 or similar scale
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for retrieving due cards
CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review ON flashcards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_flashcards_status ON flashcards(status);

-- Flashcard Reviews (History log)
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  rating TEXT CHECK (rating IN ('not_confident', 'somewhat_confident', 'confident')),
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on flashcards" ON flashcards FOR ALL USING (true);
CREATE POLICY "Allow all operations on flashcard_reviews" ON flashcard_reviews FOR ALL USING (true);
