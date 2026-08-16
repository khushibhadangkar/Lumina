-- ============================================================
-- LUMINA — Supabase PostgreSQL Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Countries
create table if not exists countries (
  id        text primary key,
  name      text not null,
  iso_code  text not null,
  latitude  float8 not null default 0,
  longitude float8 not null default 0,
  region    text not null default ''
);

-- Topics (commodities / sectors)
create table if not exists topics (
  id           text primary key,
  title        text not null,
  market_size  text not null default 'N/A',
  growth_rate  text not null default 'N/A',
  trade_volume text not null default 'N/A',
  source       text not null default ''
);

-- Country × Topic scored metrics
create table if not exists country_metrics (
  id                text primary key,
  country_id        text not null references countries(id) on delete cascade,
  topic_id          text not null references topics(id) on delete cascade,
  production_score  float8 not null default 0,
  demand_score      float8 not null default 0,
  growth_score      float8 not null default 0,
  import_score      float8 not null default 0,
  export_score      float8 not null default 0,
  opportunity_score float8 not null default 0,
  summary           text not null default ''
);

-- Trade routes between countries
create table if not exists trade_routes (
  id                  text primary key,
  source_country      text not null references countries(id) on delete cascade,
  destination_country text not null references countries(id) on delete cascade,
  volume              text not null default 'N/A',
  topic_id            text not null references topics(id) on delete cascade
);

-- Country-level intelligence insights
create table if not exists country_insights (
  id         text primary key,
  country_id text not null references countries(id) on delete cascade,
  topic_id   text not null references topics(id) on delete cascade,
  insight    text not null default ''
);

-- Related topic graph edges
create table if not exists related_topics (
  id               text primary key,
  topic_id         text not null references topics(id) on delete cascade,
  related_topic_id text not null references topics(id) on delete cascade
);

-- ============================================================
-- Row Level Security — Allow public select read policies only
-- ============================================================
alter table countries        enable row level security;
alter table topics           enable row level security;
alter table country_metrics  enable row level security;
alter table trade_routes     enable row level security;
alter table country_insights enable row level security;
alter table related_topics   enable row level security;

-- Drop existing public read policies if they exist (to recreate them cleanly)
drop policy if exists "Public read countries"        on countries;
drop policy if exists "Public read topics"           on topics;
drop policy if exists "Public read country_metrics"  on country_metrics;
drop policy if exists "Public read trade_routes"     on trade_routes;
drop policy if exists "Public read country_insights" on country_insights;
drop policy if exists "Public read related_topics"   on related_topics;

-- SELECT: Allow public read (both anonymous and authenticated users)
create policy "Public read countries"        on countries        for select using (true);
create policy "Public read topics"           on topics           for select using (true);
create policy "Public read country_metrics"  on country_metrics  for select using (true);
create policy "Public read trade_routes"     on trade_routes     for select using (true);
create policy "Public read country_insights" on country_insights for select using (true);
create policy "Public read related_topics"   on related_topics   for select using (true);

-- NOTE: No INSERT, UPDATE, or DELETE policies are created. 
-- RLS default behavior blocks all writes for public/authenticated roles.
-- Administrative database updates (insert, delete, reseed, ingest) are executed
-- exclusively server-side via the backend proxy using the Supabase Service Role Key.

-- DDL for trade_flows table preserving raw Comtrade dimensions
create table if not exists trade_flows (
  reporter_code      integer not null,
  partner_code       integer not null,
  commodity_code     text not null,
  flow_code          text not null,
  period             text not null,
  mot_code           integer not null,
  quantity           numeric,
  net_weight         numeric,
  gross_weight       numeric,
  primary_value      numeric,
  fob_value          numeric,
  source             text,
  source_url         text,
  retrieved_at       timestamptz not null default now(),
  type_code          text,
  freq_code          text,
  cl_code            text,
  qty_unit_code      integer,
  reporter_iso       text,
  partner_iso        text,
  customs_code       integer,
  primary key (reporter_code, partner_code, commodity_code, flow_code, period, mot_code)
);

alter table trade_flows enable row level security;

drop policy if exists "Public read trade_flows" on trade_flows;
create policy "Public read trade_flows" on trade_flows for select using (true);
