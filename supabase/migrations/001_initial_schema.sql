-- VAULT — Database Schema
-- Run this in your Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT NULL,
  tool_calls JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memories
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fact', 'event', 'preference', 'person', 'project', 'file', 'skill')),
  content TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('conversation', 'upload', 'voice', 'manual')),
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  importance FLOAT DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  access_count INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vector index for fast similarity search
CREATE INDEX IF NOT EXISTS memories_embedding_idx
  ON memories USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Memories user index
CREATE INDEX IF NOT EXISTS memories_user_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS memories_type_idx ON memories(type);

-- Files
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  gemini_file_uri TEXT,
  analysis TEXT,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS files_user_idx ON files(user_id);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  source_memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_pending_idx ON tasks(user_id, completed) WHERE completed = false;

-- Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can manage their own conversations"
  ON conversations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their conversations"
  ON messages FOR ALL USING (
    conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their own memories"
  ON memories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own files"
  ON files FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

-- Storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-files', 'vault-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vault-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vault-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vault-files' AND auth.uid()::text = (storage.foldername(name))[1]);
