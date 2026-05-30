-- Halyk Pro — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text not null,
  phone text,
  role text check (role in ('client', 'expert', 'both')) default 'client',
  halyk_id_verified boolean default false,
  created_at timestamptz default now()
);

-- Expert profiles
create table if not exists expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  category text check (category in ('accountant', 'tax', 'lawyer', 'advocate')),
  specializations text[] default '{}',
  experience_years integer default 0,
  hourly_rate integer default 0,
  bio text,
  avatar_url text,
  diploma_url text,
  rating numeric(3,2) default 0,
  completed_deals integer default 0,
  is_verified boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Client profiles
create table if not exists client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  company_name text,
  bin_iin text,
  company_type text check (company_type in ('ip', 'too', 'individual')),
  total_deals integer default 0,
  rating numeric(3,2) default 0,
  created_at timestamptz default now()
);

-- Deals
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references users(id),
  expert_id uuid references users(id),
  category text,
  description text,
  status text check (status in ('pending', 'active', 'completed', 'disputed', 'cancelled')) default 'pending',
  escrow_amount integer default 0,
  commission integer default 0,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Messages (realtime)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  sender_id uuid references users(id),
  content text not null,
  created_at timestamptz default now()
);

-- Enable realtime for messages
alter publication supabase_realtime add table messages;

-- Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id),
  reviewer_id uuid references users(id),
  reviewee_id uuid references users(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_expert_profiles_category on expert_profiles(category);
create index if not exists idx_deals_client_id on deals(client_id);
create index if not exists idx_deals_expert_id on deals(expert_id);
create index if not exists idx_messages_deal_id on messages(deal_id);

-- Row Level Security (RLS)
alter table users enable row level security;
alter table expert_profiles enable row level security;
alter table client_profiles enable row level security;
alter table deals enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;

-- Policies (demo: allow all for authenticated users)
create policy "Allow all for demo" on users for all using (true);
create policy "Allow all for demo" on expert_profiles for all using (true);
create policy "Allow all for demo" on client_profiles for all using (true);
create policy "Allow all for demo" on deals for all using (true);
create policy "Allow all for demo" on messages for all using (true);
create policy "Allow all for demo" on reviews for all using (true);
