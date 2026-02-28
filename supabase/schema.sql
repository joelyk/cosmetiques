create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists catalog_categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  short_description text not null,
  description text not null,
  brand_required boolean not null default false,
  accent text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog_products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category_id text not null references catalog_categories(id) on delete restrict,
  brand text,
  short_description text not null,
  description text not null,
  price_cents bigint not null check (price_cents >= 0),
  currency text not null default 'XAF',
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  featured boolean not null default false,
  hero_image text not null,
  gallery jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  stock_label text not null,
  volume_label text,
  badge text,
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists promotions (
  id text primary key,
  code text not null unique,
  title text not null,
  description text not null,
  discount_percent integer not null check (discount_percent between 1 and 90),
  category_id text references catalog_categories(id) on delete set null,
  product_id text references catalog_products(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists page_visit_events (
  id bigint generated always as identity primary key,
  pathname text not null,
  session_id text not null,
  source text not null default 'site',
  created_at timestamptz not null default now()
);

create table if not exists product_click_events (
  id bigint generated always as identity primary key,
  product_id text not null,
  source text not null default 'site',
  created_at timestamptz not null default now()
);

create table if not exists checkout_requests (
  id bigint generated always as identity primary key,
  customer_name text not null,
  customer_phone text not null,
  city text not null,
  payment_method text not null,
  items_count integer not null,
  items jsonb not null default '[]'::jsonb,
  channel text not null default 'whatsapp',
  created_at timestamptz not null default now()
);

alter table catalog_categories
  add column if not exists short_description text not null default '',
  add column if not exists description text not null default '',
  add column if not exists brand_required boolean not null default false,
  add column if not exists accent text not null default 'from-amber-300 via-orange-200 to-rose-200',
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table catalog_products
  add column if not exists review_count integer not null default 0,
  add column if not exists clicks integer not null default 0,
  add column if not exists volume_label text,
  add column if not exists badge text,
  add column if not exists status text not null default 'draft',
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists tags text[] not null default '{}',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table promotions
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table checkout_requests
  add column if not exists items jsonb not null default '[]'::jsonb;

create index if not exists idx_catalog_products_category_id
  on catalog_products(category_id);
create index if not exists idx_product_click_events_product_id
  on product_click_events(product_id);
create index if not exists idx_page_visit_events_created_at
  on page_visit_events(created_at);
create index if not exists idx_product_click_events_created_at
  on product_click_events(created_at);
create index if not exists idx_checkout_requests_created_at
  on checkout_requests(created_at);

drop trigger if exists set_catalog_categories_updated_at on catalog_categories;
create trigger set_catalog_categories_updated_at
before update on catalog_categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_catalog_products_updated_at on catalog_products;
create trigger set_catalog_products_updated_at
before update on catalog_products
for each row
execute function public.set_updated_at();

drop trigger if exists set_promotions_updated_at on promotions;
create trigger set_promotions_updated_at
before update on promotions
for each row
execute function public.set_updated_at();

alter table catalog_categories enable row level security;
alter table catalog_products enable row level security;
alter table promotions enable row level security;
alter table page_visit_events enable row level security;
alter table product_click_events enable row level security;
alter table checkout_requests enable row level security;

drop policy if exists "Allow public read on active categories" on catalog_categories;
create policy "Allow public read on active categories"
on catalog_categories
for select
to anon
using (is_active = true);

drop policy if exists "Allow public read on active products" on catalog_products;
create policy "Allow public read on active products"
on catalog_products
for select
to anon
using (status = 'active');

drop policy if exists "Allow public read on active promotions" on promotions;
create policy "Allow public read on active promotions"
on promotions
for select
to anon
using (is_active = true);
