-- Supabase schema for FIUBA Map

create table if not exists user_logins (
  padron text not null,
  carreraid text not null,
  orientacionid text,
  findecarreraid text,
  updated_at timestamptz not null default now(),
  primary key (padron, carreraid)
);

create table if not exists user_maps (
  padron text not null,
  carreraid text not null,
  map jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (padron, carreraid)
);

alter table user_logins enable row level security;
alter table user_maps enable row level security;

create policy "public read/write user_logins"
  on user_logins for all
  using (true) with check (true);

create policy "public read/write user_maps"
  on user_maps for all
  using (true) with check (true);
