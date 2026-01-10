-- Revision Items table
CREATE TABLE IF NOT EXISTS revision_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question JSONB NOT NULL,
  user_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_revision_items_user_id ON revision_items(user_id);

-- RLS
ALTER TABLE revision_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on revision_items" ON revision_items FOR ALL USING (true);
