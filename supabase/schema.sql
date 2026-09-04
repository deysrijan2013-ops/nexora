
-- NEXORA FINAL DATABASE
-- Paste this entire file into Supabase SQL Editor and Run.
create extension if not exists pgcrypto;

create table if not exists businesses(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz default now());
create table if not exists profiles(id uuid primary key references auth.users(id) on delete cascade,business_id uuid not null references businesses(id) on delete cascade,full_name text,created_at timestamptz default now());
create table if not exists customers(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,name text not null,phone text,email text,address text,created_at timestamptz default now());
create table if not exists manufacturers(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,company_name text not null,contact_name text,phone text,email text,created_at timestamptz default now());
create table if not exists products(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,name text not null,sku text not null,purchase_price numeric(14,2) default 0,selling_price numeric(14,2) default 0,stock integer default 0,min_stock integer default 5,created_at timestamptz default now(),unique(business_id,sku));
create table if not exists sales(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,customer_id uuid references customers(id) on delete set null,invoice_no text not null,total numeric(14,2) default 0,paid_amount numeric(14,2) default 0,due_amount numeric(14,2) default 0,gross_profit numeric(14,2) default 0,created_at timestamptz default now(),unique(business_id,invoice_no));
create table if not exists sale_items(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,sale_id uuid not null references sales(id) on delete cascade,product_id uuid not null references products(id),quantity integer not null,unit_price numeric(14,2) not null,cost_price numeric(14,2) not null,total numeric(14,2) not null);
create table if not exists purchases(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,manufacturer_id uuid references manufacturers(id) on delete set null,purchase_no text not null,total numeric(14,2) default 0,paid_amount numeric(14,2) default 0,due_amount numeric(14,2) default 0,created_at timestamptz default now(),unique(business_id,purchase_no));
create table if not exists purchase_items(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,purchase_id uuid not null references purchases(id) on delete cascade,product_id uuid not null references products(id),quantity integer not null,unit_cost numeric(14,2) not null,total numeric(14,2) not null);
create table if not exists payments(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,type text not null check(type in ('received','sent')),amount numeric(14,2) not null,method text default 'Cash',note text,created_at timestamptz default now());
create table if not exists expenses(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,category text not null,description text,amount numeric(14,2) not null,created_at timestamptz default now());
create table if not exists market_items(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,name text not null,category text,estimated_demand text,status text default 'watch',created_at timestamptz default now());
create table if not exists inventory_movements(id uuid primary key default gen_random_uuid(),business_id uuid not null references businesses(id) on delete cascade,product_id uuid not null references products(id),quantity integer not null,reason text not null,reference_id uuid,created_at timestamptz default now());

create or replace function current_business_id() returns uuid language sql stable security definer set search_path=public as $$
 select business_id from profiles where id=auth.uid() limit 1;
$$;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare b uuid;
begin
 insert into businesses(name) values(coalesce(new.raw_user_meta_data->>'business_name','My Business')) returning id into b;
 insert into profiles(id,business_id,full_name) values(new.id,b,new.raw_user_meta_data->>'full_name');
 return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table businesses enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table manufacturers enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table market_items enable row level security;
alter table inventory_movements enable row level security;

do $$ declare t text; begin
 for t in select unnest(array['customers','manufacturers','products','sales','sale_items','purchases','purchase_items','payments','expenses','market_items','inventory_movements']) loop
   execute format('drop policy if exists business_isolation on %I',t);
   execute format('create policy business_isolation on %I for all using (business_id=current_business_id()) with check (business_id=current_business_id())',t);
 end loop;
end $$;

drop policy if exists profile_self on profiles;
create policy profile_self on profiles for select using(id=auth.uid());

drop policy if exists business_self on businesses;
create policy business_self on businesses for select using(id=current_business_id());

create or replace function create_product(p_name text,p_sku text,p_purchase_price numeric,p_selling_price numeric,p_stock integer,p_min_stock integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare id uuid;
begin
 insert into products(business_id,name,sku,purchase_price,selling_price,stock,min_stock) values(current_business_id(),p_name,p_sku,p_purchase_price,p_selling_price,p_stock,p_min_stock) returning products.id into id;
 return jsonb_build_object('id',id);
end $$;

create or replace function create_customers(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare id uuid;
begin
 insert into customers(business_id,name,phone,email,address) values(current_business_id(),p_data->>'name',p_data->>'phone',p_data->>'email',p_data->>'address') returning customers.id into id;
 return jsonb_build_object('id',id);
end $$;

create or replace function create_manufacturers(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare id uuid;
begin
 insert into manufacturers(business_id,company_name,contact_name,phone,email) values(current_business_id(),p_data->>'company_name',p_data->>'contact_name',p_data->>'phone',p_data->>'email') returning manufacturers.id into id;
 return jsonb_build_object('id',id);
end $$;

create or replace function create_payments(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare id uuid;
begin
 insert into payments(business_id,type,amount,method,note) values(current_business_id(),coalesce(p_data->>'type','received'),(p_data->>'amount')::numeric,coalesce(p_data->>'method','Cash'),p_data->>'note') returning payments.id into id;
 return jsonb_build_object('id',id);
end $$;

create or replace function create_expenses(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare id uuid;
begin
 insert into expenses(business_id,category,description,amount) values(current_business_id(),p_data->>'category',p_data->>'description',(p_data->>'amount')::numeric) returning expenses.id into id;
 return jsonb_build_object('id',id);
end $$;

create or replace function create_market_items(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare id uuid;
begin
 insert into market_items(business_id,name,category,estimated_demand,status) values(current_business_id(),p_data->>'name',p_data->>'category',p_data->>'estimated_demand',coalesce(p_data->>'status','watch')) returning market_items.id into id;
 return jsonb_build_object('id',id);
end $$;

create or replace function create_sale(p_customer_id uuid,p_items jsonb,p_paid_amount numeric default 0) returns jsonb language plpgsql security definer set search_path=public as $$
declare b uuid:=current_business_id(); sid uuid; rec jsonb; pid uuid; qty int; price numeric; cost numeric; total numeric:=0; gp numeric:=0; inv text;
begin
 inv:='INV-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,5);
 insert into sales(business_id,customer_id,invoice_no) values(b,p_customer_id,inv) returning id into sid;
 for rec in select * from jsonb_array_elements(p_items) loop
  pid:=(rec->>'product_id')::uuid; qty:=(rec->>'quantity')::int;
  select selling_price,purchase_price into price,cost from products where id=pid and business_id=b for update;
  if not found then raise exception 'Product not found'; end if;
  if (select stock from products where id=pid)<qty then raise exception 'Insufficient stock'; end if;
  insert into sale_items(business_id,sale_id,product_id,quantity,unit_price,cost_price,total) values(b,sid,pid,qty,price,cost,price*qty);
  update products set stock=stock-qty where id=pid;
  insert into inventory_movements(business_id,product_id,quantity,reason,reference_id) values(b,pid,-qty,'sale',sid);
  total:=total+price*qty; gp:=gp+(price-cost)*qty;
 end loop;
 update sales set total=total,paid_amount=least(greatest(p_paid_amount,0),total),due_amount=greatest(total-least(greatest(p_paid_amount,0),total),0),gross_profit=gp where id=sid;
 return jsonb_build_object('id',sid,'invoice_no',inv);
end $$;

create or replace function create_purchase(p_manufacturer_id uuid,p_items jsonb,p_paid_amount numeric default 0) returns jsonb language plpgsql security definer set search_path=public as $$
declare b uuid:=current_business_id(); pid uuid; purid uuid; rec jsonb; qty int; cost numeric; total numeric:=0; inv text;
begin
 if p_manufacturer_id is not null and not exists(select 1 from manufacturers where id=p_manufacturer_id and business_id=b) then raise exception 'Manufacturer not found'; end if;
 inv:='PUR-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,5);
 insert into purchases(business_id,manufacturer_id,purchase_no) values(b,p_manufacturer_id,inv) returning id into purid;
 for rec in select * from jsonb_array_elements(p_items) loop
  pid:=(rec->>'product_id')::uuid; qty:=(rec->>'quantity')::int;
  select purchase_price into cost from products where id=pid and business_id=b for update;
  if not found then raise exception 'Product not found'; end if;
  insert into purchase_items(business_id,purchase_id,product_id,quantity,unit_cost,total) values(b,purid,pid,qty,cost,cost*qty);
  update products set stock=stock+qty where id=pid;
  insert into inventory_movements(business_id,product_id,quantity,reason,reference_id) values(b,pid,qty,'purchase',purid);
  total:=total+cost*qty;
 end loop;
 update purchases set total=total,paid_amount=least(greatest(p_paid_amount,0),total),due_amount=greatest(total-least(greatest(p_paid_amount,0),total),0) where id=purid;
 return jsonb_build_object('id',purid,'purchase_no',inv);
end $$;

revoke all on function create_product(text,text,numeric,numeric,integer,integer) from public;
revoke all on function create_sale(uuid,jsonb,numeric) from public;
revoke all on function create_purchase(uuid,jsonb,numeric) from public;
grant execute on function create_product(text,text,numeric,numeric,integer,integer) to authenticated;
grant execute on function create_sale(uuid,jsonb,numeric) to authenticated;
grant execute on function create_purchase(uuid,jsonb,numeric) to authenticated;
grant execute on function create_customers(jsonb) to authenticated;
grant execute on function create_manufacturers(jsonb) to authenticated;
grant execute on function create_payments(jsonb) to authenticated;
grant execute on function create_expenses(jsonb) to authenticated;
grant execute on function create_market_items(jsonb) to authenticated;

create index if not exists products_business_idx on products(business_id);
create index if not exists sales_business_date_idx on sales(business_id,created_at desc);
create index if not exists purchases_business_date_idx on purchases(business_id,created_at desc);
create index if not exists payments_business_date_idx on payments(business_id,created_at desc);
create index if not exists expenses_business_date_idx on expenses(business_id,created_at desc);
