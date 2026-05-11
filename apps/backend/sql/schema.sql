create extension if not exists "pgcrypto";

create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  message text not null,
  context text,
  created_at timestamptz default now()
);

create table if not exists conversation_scores (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references conversation_messages(id) on delete cascade,
  interest integer not null,
  risk text not null,
  created_at timestamptz default now()
);

create table if not exists user_growth_scores (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references conversation_messages(id) on delete cascade,
  quality integer not null,
  investment integer not null,
  tone integer not null,
  power integer not null,
  created_at timestamptz default now()
);
