-- Halyk Pro — Fresh Migration
-- Run this in Supabase SQL Editor to reset the demo tables

drop table if exists messages cascade;
drop table if exists deals cascade;

create table deals (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  client_name text default 'Клиент',
  expert_name text,
  description text,
  status text check (status in ('pending', 'claimed', 'offered', 'active', 'completed', 'cancelled')) default 'pending',
  offer_price integer,
  offer_deadline text,
  offer_comment text,
  escrow_amount integer default 0,
  commission integer default 0,
  commission_pct integer default 5,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  sender_role text check (sender_role in ('client', 'expert')) not null,
  sender_name text not null,
  content text not null,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table deals;
alter publication supabase_realtime add table messages;

create index idx_deals_room_code on deals(room_code);
create index idx_deals_status on deals(status);
create index idx_messages_deal_id on messages(deal_id);

alter table deals enable row level security;
alter table messages enable row level security;

create policy "Allow all for demo" on deals for all using (true) with check (true);
create policy "Allow all for demo" on messages for all using (true) with check (true);
