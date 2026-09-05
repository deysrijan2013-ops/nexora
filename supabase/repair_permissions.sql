-- Bizora: repair Supabase permissions for an existing project.
-- Run this once in Supabase SQL Editor as the project owner/postgres role.

begin;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.businesses to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.manufacturers to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.sales to authenticated;
grant select, insert, update, delete on table public.purchases to authenticated;
grant select, insert, update, delete on table public.payments to authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.market_items to authenticated;

-- Make sure the expected RLS policies exist and replace any damaged versions.
drop policy if exists "owner businesses" on public.businesses;
drop policy if exists "own profiles" on public.profiles;
drop policy if exists "own customers" on public.customers;
drop policy if exists "own manufacturers" on public.manufacturers;
drop policy if exists "own products" on public.products;
drop policy if exists "own sales" on public.sales;
drop policy if exists "own purchases" on public.purchases;
drop policy if exists "own payments" on public.payments;
drop policy if exists "own expenses" on public.expenses;
drop policy if exists "own market_items" on public.market_items;

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

create policy "owner businesses" on public.businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own profiles" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own customers" on public.customers
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "own manufacturers" on public.manufacturers
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "own products" on public.products
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "own sales" on public.sales
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "own purchases" on public.purchases
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "own payments" on public.payments
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "own expenses" on public.expenses
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "own market_items" on public.market_items
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

commit;
