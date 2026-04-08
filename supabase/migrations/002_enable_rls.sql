-- Security hardening: RLS + unique index
-- Ref: IMP-26

-- 1. Enable Row Level Security on all tables
--    Service-role key bypasses RLS; anon key is blocked by default (no permissive policies).
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 2. Unique index prevents duplicate doc_type per session
CREATE UNIQUE INDEX idx_documents_session_doc_type ON documents (session_id, doc_type);
