-- Derby Digital Onboarding Portal - Initial Schema
-- Sessions, Documents, Submissions

-- Sessions table: tracks each onboarding session
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_token ON sessions (token);
CREATE INDEX idx_sessions_status ON sessions (status);

-- Documents table: uploaded files per session
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_session_id ON documents (session_id);

-- Submissions table: flattened form fields for completed onboarding
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  -- Business info
  business_name TEXT,
  business_phone TEXT,
  business_email TEXT,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_zip TEXT,
  -- Service info
  service_categories TEXT[],
  service_area_miles INTEGER,
  -- Ad preferences
  weekly_budget_cents INTEGER,
  target_start_date DATE,
  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_session_id ON submissions (session_id);

-- Updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Storage bucket for documents (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, file_size_limit, allowed_mime_types)
-- VALUES ('documents', 'documents', 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
