-- Activity log for tracking admin actions on submissions
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  performed_by text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_submission_id ON activity_log(submission_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_log_select" ON activity_log FOR SELECT USING (true);
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT WITH CHECK (true);
