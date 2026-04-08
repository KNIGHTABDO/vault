-- File ingestion and semantic chunk indexing
-- Adds parse/index status fields to files and introduces chunk-level embeddings.

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS parse_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed', 'binary')),
  ADD COLUMN IF NOT EXISTS parser TEXT,
  ADD COLUMN IF NOT EXISTS parse_error TEXT,
  ADD COLUMN IF NOT EXISTS content_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS file_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  token_estimate INT,
  embedding vector(768),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (file_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS file_chunks_file_idx ON file_chunks(file_id);
CREATE INDEX IF NOT EXISTS file_chunks_user_idx ON file_chunks(user_id);
CREATE INDEX IF NOT EXISTS file_chunks_user_file_idx ON file_chunks(user_id, file_id);
CREATE INDEX IF NOT EXISTS file_chunks_embedding_idx
  ON file_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE file_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'file_chunks'
      AND policyname = 'Users can manage their own file chunks'
  ) THEN
    CREATE POLICY "Users can manage their own file chunks"
      ON file_chunks FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION match_file_chunks(
  p_user_id UUID,
  p_query_embedding vector(768),
  p_match_count INT DEFAULT 6
)
RETURNS TABLE (
  file_id UUID,
  file_name TEXT,
  chunk_index INT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    fc.file_id,
    f.name AS file_name,
    fc.chunk_index,
    fc.content,
    1 - (fc.embedding <=> p_query_embedding) AS similarity
  FROM file_chunks fc
  JOIN files f ON f.id = fc.file_id
  WHERE fc.user_id = p_user_id
    AND fc.embedding IS NOT NULL
  ORDER BY fc.embedding <=> p_query_embedding
  LIMIT GREATEST(1, LEAST(COALESCE(p_match_count, 6), 20));
$$;