-- Client profile tables for Phase 1: ad strategies, campaigns, metrics, leads

-- Ad Strategies
CREATE TABLE IF NOT EXISTS ad_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  strategy_notes text,
  target_audience text,
  positioning text,
  competitive_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_strategies_client_id ON ad_strategies(client_id);
ALTER TABLE ad_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_strategies_all" ON ad_strategies USING (true) WITH CHECK (true);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL DEFAULT 'google',
  budget_cents integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT campaigns_platform_check CHECK (platform IN ('google','meta','yelp','nextdoor','other')),
  CONSTRAINT campaigns_status_check CHECK (status IN ('draft','active','paused','completed'))
);

CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON campaigns(client_id);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_all" ON campaigns USING (true) WITH CHECK (true);

-- Campaign Metrics
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  spend_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(date DESC);
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_metrics_all" ON campaign_metrics USING (true) WITH CHECK (true);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  source text,
  status text NOT NULL DEFAULT 'new',
  response_time_ms integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT leads_status_check CHECK (status IN ('new','contacted','qualified','converted','lost'))
);

CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_all" ON leads USING (true) WITH CHECK (true);
