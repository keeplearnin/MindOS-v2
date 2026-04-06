-- HealthOS: Knowledge sources, transcripts with pgvector embeddings, Q&A, protocols
-- Enables loading YouTube channels, RAG-based health Q&A, and experiment tracking

-- Enable pgvector extension for similarity search
create extension if not exists vector;

-- ─── Knowledge Sources ─────────────────────────────────────────
-- Tracks loaded YouTube channels (expandable to other source types)

create table knowledge_sources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('youtube_channel', 'youtube_video')),
  title text not null,
  url text not null,
  channel_id text,
  video_count int default 0,
  status text not null default 'pending' check (status in ('pending', 'loading', 'ready', 'error')),
  metadata jsonb default '{}',
  error_message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index knowledge_sources_user_created on knowledge_sources(user_id, created_at desc);

alter table knowledge_sources enable row level security;
create policy "Users can read own sources" on knowledge_sources for select using (auth.uid() = user_id);
create policy "Users can insert own sources" on knowledge_sources for insert with check (auth.uid() = user_id);
create policy "Users can update own sources" on knowledge_sources for update using (auth.uid() = user_id);
create policy "Users can delete own sources" on knowledge_sources for delete using (auth.uid() = user_id);

create trigger update_knowledge_sources_updated_at
  before update on knowledge_sources
  for each row execute function public.update_updated_at();

-- ─── Knowledge Videos ──────────────────────────────────────────
-- Individual videos within a source channel

create table knowledge_videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_id uuid references knowledge_sources(id) on delete cascade not null,
  video_id text not null,
  title text not null,
  url text not null,
  published_at timestamptz,
  duration_seconds int,
  thumbnail_url text,
  transcript_status text not null default 'pending'
    check (transcript_status in ('pending', 'loading', 'ready', 'error', 'no_transcript')),
  chunk_count int default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null,
  unique(user_id, video_id)
);

create index knowledge_videos_source on knowledge_videos(source_id, published_at desc);
create index knowledge_videos_user on knowledge_videos(user_id, created_at desc);

alter table knowledge_videos enable row level security;
create policy "Users can read own videos" on knowledge_videos for select using (auth.uid() = user_id);
create policy "Users can insert own videos" on knowledge_videos for insert with check (auth.uid() = user_id);
create policy "Users can update own videos" on knowledge_videos for update using (auth.uid() = user_id);
create policy "Users can delete own videos" on knowledge_videos for delete using (auth.uid() = user_id);

-- ─── Transcript Chunks ─────────────────────────────────────────
-- Chunked transcript text with vector embeddings for similarity search

create table transcript_chunks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references knowledge_videos(id) on delete cascade not null,
  chunk_index int not null,
  content text not null,
  start_seconds float,
  end_seconds float,
  token_count int,
  embedding vector(1536),
  created_at timestamptz default now() not null
);

create index transcript_chunks_video on transcript_chunks(video_id, chunk_index);
create index transcript_chunks_user on transcript_chunks(user_id);

-- IVFFlat index for vector similarity search
-- Use 100 lists — good for personal knowledge bases under 100K chunks
create index transcript_chunks_embedding on transcript_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table transcript_chunks enable row level security;
create policy "Users can read own chunks" on transcript_chunks for select using (auth.uid() = user_id);
create policy "Users can insert own chunks" on transcript_chunks for insert with check (auth.uid() = user_id);
create policy "Users can delete own chunks" on transcript_chunks for delete using (auth.uid() = user_id);

-- ─── Health Queries ────────────────────────────────────────────
-- Saved RAG Q&A with citations

create table health_queries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question text not null,
  answer text not null,
  citations jsonb default '[]',
  model text default 'claude-sonnet-4-20250514',
  tokens_used int,
  created_at timestamptz default now() not null
);

create index health_queries_user_created on health_queries(user_id, created_at desc);

alter table health_queries enable row level security;
create policy "Users can read own queries" on health_queries for select using (auth.uid() = user_id);
create policy "Users can insert own queries" on health_queries for insert with check (auth.uid() = user_id);
create policy "Users can delete own queries" on health_queries for delete using (auth.uid() = user_id);

-- ─── Health Protocols ──────────────────────────────────────────
-- Structured experiments derived from Q&A

create table health_protocols (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  query_id uuid references health_queries(id) on delete set null,
  title text not null,
  hypothesis text,
  protocol_steps jsonb default '[]',
  success_criteria jsonb default '[]',
  timeframe_days int default 30,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'abandoned')),
  start_date date,
  end_date date,
  results text,
  source_citations jsonb default '[]',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index health_protocols_user_status on health_protocols(user_id, status, created_at desc);

alter table health_protocols enable row level security;
create policy "Users can read own protocols" on health_protocols for select using (auth.uid() = user_id);
create policy "Users can insert own protocols" on health_protocols for insert with check (auth.uid() = user_id);
create policy "Users can update own protocols" on health_protocols for update using (auth.uid() = user_id);
create policy "Users can delete own protocols" on health_protocols for delete using (auth.uid() = user_id);

create trigger update_health_protocols_updated_at
  before update on health_protocols
  for each row execute function public.update_updated_at();

-- ─── Vector Similarity Search RPC ──────────────────────────────
-- Called from API routes to find relevant transcript chunks

create or replace function match_transcript_chunks(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count int default 8,
  match_threshold float default 0.3
)
returns table (
  id uuid,
  video_id uuid,
  chunk_index int,
  content text,
  start_seconds float,
  end_seconds float,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    tc.id,
    tc.video_id,
    tc.chunk_index,
    tc.content,
    tc.start_seconds,
    tc.end_seconds,
    1 - (tc.embedding <=> query_embedding) as similarity
  from transcript_chunks tc
  where tc.user_id = match_user_id
    and 1 - (tc.embedding <=> query_embedding) > match_threshold
  order by tc.embedding <=> query_embedding
  limit match_count;
end;
$$;
