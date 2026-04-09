-- Derby Digital Onboarding Schema
-- This documents the actual database schema (created via Supabase dashboard)
-- Tables: sessions, documents, submissions
-- Storage bucket: documents

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  current_step int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'in_progress',
  form_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  business_name text,
  business_phone text,
  business_email text,
  business_address text,
  business_city text,
  business_state text,
  business_zip text,
  service_categories text[] DEFAULT '{}',
  service_area_miles int,
  weekly_budget_cents int,
  target_start_date date,
  contact_name text,
  contact_phone text,
  contact_email text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  kickoff_booked_at timestamptz,
  pipeline_status text NOT NULL DEFAULT 'new'
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies (permissive for service role access)
CREATE POLICY IF NOT EXISTS "sessions_select" ON sessions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "sessions_insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "sessions_update" ON sessions FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "documents_select" ON documents FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "documents_insert" ON documents FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "submissions_select" ON submissions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "submissions_insert" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "submissions_update" ON submissions FOR UPDATE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_documents_session_id ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_session_id ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_pipeline_status ON submissions(pipeline_status);
