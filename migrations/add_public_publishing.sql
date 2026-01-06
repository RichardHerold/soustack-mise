-- Migration: Add public publishing support to recipes table
-- Run this in Supabase SQL Editor

-- Add columns
alter table public.recipes
  add column if not exists is_public boolean not null default false,
  add column if not exists public_id uuid unique,
  add column if not exists published_at timestamptz;

-- Trigger function to mint public_id on publish
create or replace function public.ensure_public_id()
returns trigger language plpgsql as $$
begin
  if new.is_public = true then
    if new.public_id is null then
      new.public_id := gen_random_uuid();
    end if;
    if new.published_at is null then
      new.published_at := now();
    end if;
  else
    -- optional: keep public_id for later re-publish; do NOT clear by default
    -- new.published_at := null;  -- leave as-is unless you want to track last published time
  end if;
  return new;
end $$;

drop trigger if exists recipes_ensure_public_id on public.recipes;
create trigger recipes_ensure_public_id
before insert or update on public.recipes
for each row execute function public.ensure_public_id();

-- Public fetch function (no table-wide public select)
-- Returns ONLY the canonical recipe payload (doc->'recipe') and nothing else.
create or replace function public.get_public_recipe(p_public_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select (r.doc->'recipe')::jsonb
  from public.recipes r
  where r.is_public = true
    and r.public_id = p_public_id
  limit 1;
$$;

-- Allow anon + authenticated to call the function
grant execute on function public.get_public_recipe(uuid) to anon, authenticated;

