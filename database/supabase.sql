-- Supabase schema for FIUBA Map (solo Biomedica)

drop table if exists user_checkboxes;
drop table if exists user_materias;
drop table if exists user_maps;
drop table if exists user_logins;

create table if not exists user_state (
  padron text not null,
  aprobadas jsonb not null default '[]'::jsonb,
  regularizadas text[] not null default '{}',
  no_aprobadas text[] not null default '{}',
  ingles boolean not null default false,
  trabajo_profesional boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (padron)
);

alter table user_state enable row level security;

create policy "public read/write user_state"
  on user_state for all
  using (true) with check (true);
