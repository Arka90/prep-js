-- ─────────────────────────────────────────────────────────────────────────────
-- PrepJS v2 schema  ·  single user  ·  Supabase Postgres + pgvector
--
-- Run this once in the Supabase SQL editor on an EMPTY project
-- (or run db/drop_legacy.sql first to remove the v1 tables).
--
-- All tables have RLS enabled with NO policies: the anon key can read nothing.
-- The app talks to the DB only from the server, with the service-role key.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists vector;
create extension if not exists pgcrypto;

-- Single-row app settings ----------------------------------------------------
create table if not exists app_state (
  id                    int primary key default 1 check (id = 1),
  started_on            date not null default current_date,
  daily_question_count  int  not null default 12 check (daily_question_count between 4 and 30),
  enabled_tracks        text[] not null default '{javascript,node,mongodb,react,nextjs}',
  created_at            timestamptz not null default now()
);
insert into app_state (id) values (1) on conflict do nothing;

-- Spaced-repetition state, one row per concept you've been asked about ------
create table if not exists concept_progress (
  concept_id      text primary key,
  track           text not null,
  box             int  not null default 0,   -- Leitner box 0..6 (>= 4 = mastered)
  level           int  not null default 1,   -- difficulty the concept is asked at (1..5)
  streak          int  not null default 0,   -- consecutive correct answers
  attempts        int  not null default 0,
  correct         int  not null default 0,
  last_result     text,                      -- correct | partial | wrong
  last_kind       text,                      -- question format used last time
  misconceptions  text[] not null default '{}',
  next_due        date,
  last_seen       date,
  mastered_at     timestamptz,
  updated_at      timestamptz not null default now()
);
create index if not exists concept_progress_due_idx on concept_progress (next_due);

-- Every generated question — this is the vector memory ------------------------
create table if not exists questions (
  id           uuid primary key default gen_random_uuid(),
  track        text not null,
  concept_id   text not null,
  kind         text not null,               -- predict_output | mcq | debug | explain
  mode         text not null default 'new', -- new | review | stretch (why it was asked)
  difficulty   int  not null,
  prompt       text not null,
  code         text,
  options      jsonb,                       -- mcq only: string[]
  answer       text not null,               -- canonical answer (mcq: the correct option text)
  key_points   jsonb not null default '[]', -- rubric for free-text grading
  explanation  text not null,
  angle        text,                        -- how this variant approaches the concept
  verified     boolean not null default false, -- expected output confirmed by executing the code
  embedding    vector(1536) not null,
  created_at   timestamptz not null default now()
);
create index if not exists questions_embedding_idx on questions using hnsw (embedding vector_cosine_ops);
create index if not exists questions_concept_idx on questions (concept_id, created_at desc);

-- One drill per calendar day -------------------------------------------------
create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  day           date not null unique,
  day_number    int  not null,
  question_ids  uuid[] not null default '{}',
  status        text not null default 'active', -- active | completed
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create table if not exists answers (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references sessions(id) on delete cascade,
  question_id    uuid not null references questions(id) on delete cascade,
  concept_id     text not null,
  response       text not null,
  verdict        text not null,            -- correct | partial | wrong
  score          real not null,
  feedback       text,
  misconception  text,
  time_ms        int,
  created_at     timestamptz not null default now(),
  unique (session_id, question_id)
);
create index if not exists answers_concept_idx on answers (concept_id, created_at desc);

-- Coding arena ---------------------------------------------------------------
create table if not exists challenges (
  id                  uuid primary key default gen_random_uuid(),
  day                 date not null,
  kind                text not null,          -- build | debug
  track               text not null,
  title               text not null,
  difficulty          int  not null,
  description         text not null,          -- markdown
  function_name       text not null,
  starter_code        text not null,
  reference_solution  text not null,
  tests               jsonb not null,         -- [{ name, input: any[], expected: any, hidden: bool }]
  hints               jsonb not null default '[]',
  concepts            text[] not null default '{}',
  embedding           vector(1536) not null,
  status              text not null default 'open', -- open | solved | revealed
  best_code           text,
  attempts            int  not null default 0,
  solved_at           timestamptz,
  created_at          timestamptz not null default now(),
  unique (day, kind)
);
create index if not exists challenges_embedding_idx on challenges using hnsw (embedding vector_cosine_ops);

-- Prevents two tabs from generating the same day's content twice -------------
create table if not exists generation_locks (
  key         text primary key,
  created_at  timestamptz not null default now()
);

-- Nearest-neighbour search ---------------------------------------------------
create or replace function match_questions(
  query_embedding vector(1536),
  match_count     int default 3
)
returns table (id uuid, concept_id text, prompt text, similarity float)
language sql stable
as $$
  select q.id, q.concept_id, q.prompt, 1 - (q.embedding <=> query_embedding) as similarity
  from questions q
  order by q.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_challenges(
  query_embedding vector(1536),
  match_count     int default 3
)
returns table (id uuid, title text, similarity float)
language sql stable
as $$
  select c.id, c.title, 1 - (c.embedding <=> query_embedding) as similarity
  from challenges c
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Daily activity for the heatmap, bucketed by your local day ---------------
create or replace function answer_activity(since timestamptz, tz text)
returns table (day date, answered int, correct int)
language sql stable
as $$
  select (a.created_at at time zone tz)::date as day,
         count(*)::int as answered,
         (count(*) filter (where a.verdict = 'correct'))::int as correct
  from answers a
  where a.created_at >= since
  group by 1
  order by 1;
$$;

-- Wipes all progress (used by Settings → "Start over") -----------------------
create or replace function reset_all_progress()
returns void
language plpgsql
as $$
begin
  truncate answers, sessions, questions, challenges, concept_progress, generation_locks;
  update app_state set started_on = current_date where id = 1;
end;
$$;

-- Lock everything down: server uses the service-role key, which bypasses RLS.
alter table app_state         enable row level security;
alter table concept_progress  enable row level security;
alter table questions         enable row level security;
alter table sessions          enable row level security;
alter table answers           enable row level security;
alter table challenges        enable row level security;
alter table generation_locks  enable row level security;

revoke execute on function match_questions(vector, int)    from public, anon, authenticated;
revoke execute on function match_challenges(vector, int)   from public, anon, authenticated;
revoke execute on function reset_all_progress()            from public, anon, authenticated;
revoke execute on function answer_activity(timestamptz, text) from public, anon, authenticated;
grant  execute on function match_questions(vector, int)    to service_role;
grant  execute on function match_challenges(vector, int)   to service_role;
grant  execute on function reset_all_progress()            to service_role;
grant  execute on function answer_activity(timestamptz, text) to service_role;
