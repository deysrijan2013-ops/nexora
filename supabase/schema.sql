-- BIZORA PUBLIC SCHEMA
-- Safe for a fresh Supabase project. If you already have old tables with incompatible
-- columns/RLS, use a fresh project or migrate those tables deliberately; do not blindly
-- drop production data.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  tax_id text,
  logo_url text,
  invoice_prefix text default 'INV',
  bill_footer text default 'Thank you for your business.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null, phone text, email text, address text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.manufacturers (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null, phone text, email text, address text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null, sku text, sale_price numeric(14,2) default 0, cost_price numeric(14,2) default 0, stock numeric(14,2) default 0,
 low_stock_threshold numeric(14,2) default 5, unit text default 'pcs', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sales (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 invoice_no text, customer_name text, sale_date date default current_date, total numeric(14,2) default 0, status text default 'Completed',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.purchases (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 invoice_no text, manufacturer_name text, purchase_date date default current_date, total numeric(14,2) default 0, status text default 'Completed',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 reference text, amount numeric(14,2) default 0, method text default 'Cash', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.expenses (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 category text, amount numeric(14,2) default 0, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.market_items (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null, price numeric(14,2) default 0, source text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.manufacturers enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.purchases enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.market_items enable row level security;

create or replace function public.current_business_id()
returns uuid language sql stable security definer set search_path=public
as $$ select business_id from public.profiles where id=auth.uid() limit 1 $$;

create policy "biz owner read" on public.businesses for select to authenticated
using (owner_id=auth.uid());
create policy "biz owner update" on public.businesses for update to authenticated
using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "biz owner insert" on public.businesses for insert to authenticated
with check (owner_id=auth.uid());

create policy "profile self read" on public.profiles for select to authenticated
using (id=auth.uid());
create policy "profile self insert" on public.profiles for insert to authenticated
with check (id=auth.uid());
create policy "profile self update" on public.profiles for update to authenticated
using (id=auth.uid()) with check (id=auth.uid());

do $$
declare t text;
begin
 foreach t in array array['customers','manufacturers','products','sales','purchases','payments','expenses','market_items']
 loop
   execute format('drop policy if exists "business isolation" on public.%I',t);
   execute format('create policy "business isolation" on public.%I for all to authenticated using (business_id=public.current_business_id()) with check (business_id=public.current_business_id())',t);
 end loop;
end $$;

-- OAuth setup is done in Supabase Dashboard > Authentication > Providers.
-- Enable Google and/or GitHub and add your deployed Vercel URL to Redirect URLs.
