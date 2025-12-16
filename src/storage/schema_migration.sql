-- Create table for telemetry events
CREATE TABLE IF NOT EXISTS uplim_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'error', 'execution', 'feature_usage'
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB, -- stores error messages, execution time, etc.
  session_id TEXT, -- anonymized session identifier
  cli_version TEXT
);

-- Create table for code patterns/snippets (opt-in)
CREATE TABLE IF NOT EXISTS uplim_code_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source TEXT, -- 'cli', 'web-ide'
  analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for AI suggestions
CREATE TABLE IF NOT EXISTS uplim_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  code_diff TEXT, -- Diff or suggestion content
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB -- storing model used, confidence score, etc.
);

-- Create indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_telemetry_event_type ON uplim_telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON uplim_telemetry_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_snippets_analyzed ON uplim_code_snippets(analyzed);
