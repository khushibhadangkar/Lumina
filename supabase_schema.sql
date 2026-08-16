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
-- Row Level Security — allow public read + authenticated write
-- ============================================================
alter table countries        enable row level security;
alter table topics           enable row level security;
alter table country_metrics  enable row level security;
alter table trade_routes     enable row level security;
alter table country_insights enable row level security;
alter table related_topics   enable row level security;

-- Drop old anonymous insert policies if they exist
drop policy if exists "Anon insert countries"        on countries;
drop policy if exists "Anon insert topics"           on topics;
drop policy if exists "Anon insert country_metrics"  on country_metrics;
drop policy if exists "Anon insert trade_routes"     on trade_routes;
drop policy if exists "Anon insert country_insights" on country_insights;
drop policy if exists "Anon insert related_topics"   on related_topics;

-- Drop old anonymous delete policies if they exist
drop policy if exists "Anon delete countries"        on countries;
drop policy if exists "Anon delete topics"           on topics;
drop policy if exists "Anon delete country_metrics"  on country_metrics;
drop policy if exists "Anon delete trade_routes"     on trade_routes;
drop policy if exists "Anon delete country_insights" on country_insights;
drop policy if exists "Anon delete related_topics"   on related_topics;

-- Drop existing public read policies to recreate them cleanly
drop policy if exists "Public read countries"        on countries;
drop policy if exists "Public read topics"           on topics;
drop policy if exists "Public read country_metrics"  on country_metrics;
drop policy if exists "Public read trade_routes"     on trade_routes;
drop policy if exists "Public read country_insights" on country_insights;
drop policy if exists "Public read related_topics"   on related_topics;

-- Drop authenticated insert policies if they exist
drop policy if exists "Authenticated insert countries"        on countries;
drop policy if exists "Authenticated insert topics"           on topics;
drop policy if exists "Authenticated insert country_metrics"  on country_metrics;
drop policy if exists "Authenticated insert trade_routes"     on trade_routes;
drop policy if exists "Authenticated insert country_insights" on country_insights;
drop policy if exists "Authenticated insert related_topics"   on related_topics;

-- Drop authenticated update policies if they exist
drop policy if exists "Authenticated update countries"        on countries;
drop policy if exists "Authenticated update topics"           on topics;
drop policy if exists "Authenticated update country_metrics"  on country_metrics;
drop policy if exists "Authenticated update trade_routes"     on trade_routes;
drop policy if exists "Authenticated update country_insights" on country_insights;
drop policy if exists "Authenticated update related_topics"   on related_topics;

-- Drop authenticated delete policies if they exist
drop policy if exists "Authenticated delete countries"        on countries;
drop policy if exists "Authenticated delete topics"           on topics;
drop policy if exists "Authenticated delete country_metrics"  on country_metrics;
drop policy if exists "Authenticated delete trade_routes"     on trade_routes;
drop policy if exists "Authenticated delete country_insights" on country_insights;
drop policy if exists "Authenticated delete related_topics"   on related_topics;

-- SELECT: Allow public read (both anonymous and authenticated users)
create policy "Public read countries"        on countries        for select using (true);
create policy "Public read topics"           on topics           for select using (true);
create policy "Public read country_metrics"  on country_metrics  for select using (true);
create policy "Public read trade_routes"     on trade_routes     for select using (true);
create policy "Public read country_insights" on country_insights for select using (true);
create policy "Public read related_topics"   on related_topics   for select using (true);

-- INSERT: Only authenticated users
create policy "Authenticated insert countries"        on countries        for insert to authenticated with check (true);
create policy "Authenticated insert topics"           on topics           for insert to authenticated with check (true);
create policy "Authenticated insert country_metrics"  on country_metrics  for insert to authenticated with check (true);
create policy "Authenticated insert trade_routes"     on trade_routes     for insert to authenticated with check (true);
create policy "Authenticated insert country_insights" on country_insights for insert to authenticated with check (true);
create policy "Authenticated insert related_topics"   on related_topics   for insert to authenticated with check (true);

-- UPDATE: Only authenticated users
create policy "Authenticated update countries"        on countries        for update to authenticated using (true) with check (true);
create policy "Authenticated update topics"           on topics           for update to authenticated using (true) with check (true);
create policy "Authenticated update country_metrics"  on country_metrics  for update to authenticated using (true) with check (true);
create policy "Authenticated update trade_routes"     on trade_routes     for update to authenticated using (true) with check (true);
create policy "Authenticated update country_insights" on country_insights for update to authenticated using (true) with check (true);
create policy "Authenticated update related_topics"   on related_topics   for update to authenticated using (true) with check (true);

-- DELETE: Only authenticated users
create policy "Authenticated delete countries"        on countries        for delete to authenticated using (true);
create policy "Authenticated delete topics"           on topics           for delete to authenticated using (true);
create policy "Authenticated delete country_metrics"  on country_metrics  for delete to authenticated using (true);
create policy "Authenticated delete trade_routes"     on trade_routes     for delete to authenticated using (true);
create policy "Authenticated delete country_insights" on country_insights for delete to authenticated using (true);
create policy "Authenticated delete related_topics"   on related_topics   for delete to authenticated using (true);
