-- Run this in the Supabase SQL editor

-- Users table (passphrase auth)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  passphrase_hash text not null unique,
  created_at timestamptz default now()
);

-- Side dishes master
create table if not exists side_dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  appearance int not null default 0 check (appearance between -10 and 10),
  taste int not null default 0 check (taste between -10 and 10),
  ease int not null default 0 check (ease between -10 and 10),
  smell int not null default 0 check (smell between -10 and 10),
  texture int not null default 0 check (texture between -10 and 10),
  total int generated always as (appearance + taste + ease + smell + texture) stored,
  created_at timestamptz default now()
);

-- Bentos
create table if not exists bentos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  store_name text not null,
  photo_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bento <-> side dish join table
create table if not exists bento_side_dishes (
  id uuid primary key default gen_random_uuid(),
  bento_id uuid not null references bentos(id) on delete cascade,
  side_dish_id uuid not null references side_dishes(id) on delete restrict,
  unique(bento_id, side_dish_id)
);

-- Storage buckets (run in Storage settings or via API):
-- bucket: bento-photos (public)
-- bucket: side-dish-photos (public)

-- RLS policies (adjust as needed for your use case)
alter table users enable row level security;
alter table bentos enable row level security;
alter table side_dishes enable row level security;
alter table bento_side_dishes enable row level security;

-- Allow anon read/write for app functionality (adjust for production)
create policy "allow all" on users for all using (true) with check (true);
create policy "allow all" on bentos for all using (true) with check (true);
create policy "allow all" on side_dishes for all using (true) with check (true);
create policy "allow all" on bento_side_dishes for all using (true) with check (true);

-- Insert a default user (replace YOUR_HASH with SHA-256 hash of your passphrase)
-- Example: passphrase "bento" => SHA-256 hash
-- insert into users (passphrase_hash) values ('YOUR_SHA256_HASH_HERE');
