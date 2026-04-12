-- Lead response templates and log for Phase 2-3 auto-response system

-- Lead response templates (configured per client)
CREATE TABLE IF NOT EXISTS lead_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_template text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'email',
  is_active boolean NOT NULL DEFAULT true,
  delay_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT lead_responses_channel_check CHECK (channel IN ('email','sms'))
);

CREATE INDEX IF NOT EXISTS idx_lead_responses_client_id ON lead_responses(client_id);
ALTER TABLE lead_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_responses_all" ON lead_responses USING (true) WITH CHECK (true);

-- Lead response log (tracks every auto-response queued/sent per lead)
CREATE TABLE IF NOT EXISTS lead_response_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  response_id uuid NOT NULL REFERENCES lead_responses(id) ON DELETE CASCADE,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT lead_response_log_status_check CHECK (status IN ('pending','sent','failed','bounced'))
);

CREATE INDEX IF NOT EXISTS idx_lead_response_log_lead_id ON lead_response_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_response_log_response_id ON lead_response_log(response_id);
ALTER TABLE lead_response_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_response_log_all" ON lead_response_log USING (true) WITH CHECK (true);
