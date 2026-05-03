-- Additive Supabase SQL: daily seed user job for FIUBA Map
-- Runs every day at 19:35 Argentina time (22:35 UTC on Supabase)
-- Run this after the base schema in database/supabase.sql

create extension if not exists pg_cron;

create table if not exists daily_user_seed_log (
  generated_on date primary key,
  padron bigint not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.create_daily_seed_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_padron bigint;
begin
  perform pg_advisory_xact_lock(hashtext(current_date::text)::bigint);

  if exists (
    select 1
    from public.daily_user_seed_log
    where generated_on = current_date
  ) then
    return;
  end if;

  select coalesce(max(padron::bigint), 0) + 1
    into next_padron
  from public.user_state
  where padron ~ '^[0-9]+$';

  insert into public.user_state (
    padron,
    aprobadas,
    regularizadas,
    no_aprobadas,
    ingles,
    trabajo_profesional,
    updated_at
  ) values (
    next_padron::text,
    jsonb_build_array(
      jsonb_build_object('id', 'CB01', 'nota', 4)
    ),
    '{}'::text[],
    '{}'::text[],
    false,
    false,
    now()
  )
  on conflict (padron) do nothing;

  insert into public.daily_user_seed_log (generated_on, padron)
  values (current_date, next_padron)
  on conflict (generated_on) do nothing;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'daily_seed_user_state'
  ) then
    perform cron.schedule(
      'daily_seed_user_state',
      '35 22 * * *',
      'select public.create_daily_seed_user();'
    );
  end if;
end
$$;