-- UPLim Engine Database Schema
-- This script creates all tables needed for storing engine data

-- Code examples table
create table if not exists public.code_examples (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  code text not null,
  language text default 'uplim',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Engine execution history
create table if not exists public.engine_executions (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('idle', 'analyzing', 'running', 'paused', 'error')),
  code text not null,
  output text,
  error text,
  metrics jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_ms integer
);

-- Evolution history - language improvements over time
create table if not exists public.evolution_history (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  description text not null,
  impact text not null check (impact in ('critical', 'high', 'medium', 'low')),
  examples jsonb,
  created_at timestamptz default now()
);

-- Analysis reports
create table if not exists public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references public.engine_executions(id) on delete cascade,
  complexity integer,
  lines_of_code integer,
  functions_count integer,
  variables_count integer,
  suggestions jsonb,
  created_at timestamptz default now()
);

-- Security scan results
create table if not exists public.security_scans (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid references public.engine_executions(id) on delete cascade,
  vulnerabilities jsonb,
  risk_level text check (risk_level in ('critical', 'high', 'medium', 'low', 'none')),
  passed boolean default false,
  created_at timestamptz default now()
);

-- Language proposals (evolution suggestions)
create table if not exists public.language_proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  rationale text,
  examples jsonb,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'implemented')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table public.code_examples enable row level security;
alter table public.engine_executions enable row level security;
alter table public.evolution_history enable row level security;
alter table public.analysis_reports enable row level security;
alter table public.security_scans enable row level security;
alter table public.language_proposals enable row level security;

-- Public read access (no auth required for read)
create policy "Allow public read on code_examples"
  on public.code_examples for select
  using (true);

create policy "Allow public read on engine_executions"
  on public.engine_executions for select
  using (true);

create policy "Allow public read on evolution_history"
  on public.evolution_history for select
  using (true);

create policy "Allow public read on analysis_reports"
  on public.analysis_reports for select
  using (true);

create policy "Allow public read on security_scans"
  on public.security_scans for select
  using (true);

create policy "Allow public read on language_proposals"
  on public.language_proposals for select
  using (true);

-- Public write access (no auth required for inserts)
create policy "Allow public insert on engine_executions"
  on public.engine_executions for insert
  with check (true);

create policy "Allow public insert on analysis_reports"
  on public.analysis_reports for insert
  with check (true);

create policy "Allow public insert on security_scans"
  on public.security_scans for insert
  with check (true);

create policy "Allow public insert on language_proposals"
  on public.language_proposals for insert
  with check (true);

-- Indexes for performance
create index if not exists idx_engine_executions_status on public.engine_executions(status);
create index if not exists idx_engine_executions_created on public.engine_executions(started_at desc);
create index if not exists idx_evolution_history_created on public.evolution_history(created_at desc);
create index if not exists idx_language_proposals_status on public.language_proposals(status);
