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
-- Row Level Security — allow public read + anon write
-- ============================================================
alter table countries        enable row level security;
alter table topics           enable row level security;
alter table country_metrics  enable row level security;
alter table trade_routes     enable row level security;
alter table country_insights enable row level security;
alter table related_topics   enable row level security;

create policy "Public read countries"        on countries        for select using (true);
create policy "Public read topics"           on topics           for select using (true);
create policy "Public read country_metrics"  on country_metrics  for select using (true);
create policy "Public read trade_routes"     on trade_routes     for select using (true);
create policy "Public read country_insights" on country_insights for select using (true);
create policy "Public read related_topics"   on related_topics   for select using (true);

create policy "Anon insert countries"        on countries        for insert with check (true);
create policy "Anon insert topics"           on topics           for insert with check (true);
create policy "Anon insert country_metrics"  on country_metrics  for insert with check (true);
create policy "Anon insert trade_routes"     on trade_routes     for insert with check (true);
create policy "Anon insert country_insights" on country_insights for insert with check (true);
create policy "Anon insert related_topics"   on related_topics   for insert with check (true);

create policy "Anon delete countries"        on countries        for delete using (true);
create policy "Anon delete topics"           on topics           for delete using (true);
create policy "Anon delete country_metrics"  on country_metrics  for delete using (true);
create policy "Anon delete trade_routes"     on trade_routes     for delete using (true);
create policy "Anon delete country_insights" on country_insights for delete using (true);
create policy "Anon delete related_topics"   on related_topics   for delete using (true);
