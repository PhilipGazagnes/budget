-- Tag categories (e.g. "scope", "concern")
create table tag_categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- Tags belong to a category (e.g. "food" in "concern")
create table tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#6b7280',
  category_id uuid not null references tag_categories (id) on delete cascade,
  unique (name, category_id)
);

-- Transactions from bank or entered manually
create table transactions (
  id          uuid primary key default gen_random_uuid(),
  external_id text unique,
  date        date not null,
  amount      numeric(12, 2) not null,
  currency    text not null default 'EUR',
  description text not null default '',
  source      text not null check (source in ('bank', 'manual'))
);

-- Many-to-many: one tag per category per transaction enforced in app layer
create table transaction_tags (
  transaction_id uuid not null references transactions (id) on delete cascade,
  tag_id         uuid not null references tags (id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- PWA push subscriptions
create table push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  subscription jsonb not null
);

-- Key-value store for app state (e.g. last_synced_at)
create table app_state (
  key   text primary key,
  value text not null
);

-- Seed last_synced_at so the app always has a row to read
insert into app_state (key, value)
values ('last_synced_at', '1970-01-01T00:00:00.000Z');

-- RLS: enabled on all tables (single-user app — policies allow all)
alter table tag_categories     enable row level security;
alter table tags               enable row level security;
alter table transactions       enable row level security;
alter table transaction_tags   enable row level security;
alter table push_subscriptions enable row level security;
alter table app_state          enable row level security;

create policy "allow all" on tag_categories     for all using (true) with check (true);
create policy "allow all" on tags               for all using (true) with check (true);
create policy "allow all" on transactions       for all using (true) with check (true);
create policy "allow all" on transaction_tags   for all using (true) with check (true);
create policy "allow all" on push_subscriptions for all using (true) with check (true);
create policy "allow all" on app_state          for all using (true) with check (true);
