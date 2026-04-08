-- Admin dashboard: pipeline status tracking
-- Ref: IMP-40

ALTER TABLE submissions
  ADD COLUMN pipeline_status TEXT NOT NULL DEFAULT 'new'
  CHECK (pipeline_status IN ('new', 'in_progress', 'active'));

CREATE INDEX idx_submissions_pipeline_status ON submissions (pipeline_status);
