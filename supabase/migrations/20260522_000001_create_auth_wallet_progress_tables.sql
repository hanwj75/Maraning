create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  toss_user_key bigint not null unique,
  nickname text not null default '말랑이 친구',
  display_name text,
  login_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz,
  constraint app_users_login_status_check
    check (login_status in ('active', 'revoked', 'withdrawn', 'blocked'))
);

create table if not exists public.toss_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  access_token text,
  refresh_token text,
  scope text,
  expires_at timestamptz,
  refresh_expires_at timestamptz,
  referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.toss_oauth_tokens is 'Sensitive Toss OAuth token table. Store encrypted values at application layer or migrate to database encryption before production.';
comment on column public.toss_oauth_tokens.access_token is 'Do not expose to client. Encrypt before production use.';
comment on column public.toss_oauth_tokens.refresh_token is 'Do not expose to client. Encrypt before production use.';

create table if not exists public.user_wallets (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  jelly integer not null default 20,
  last_daily_refill_date date,
  updated_at timestamptz not null default now(),
  constraint user_wallets_jelly_range_check check (jelly >= 0 and jelly <= 100)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  difficulty text not null,
  unlocked_chapter_ids jsonb not null default '[]'::jsonb,
  completed_chapter_ids jsonb not null default '[]'::jsonb,
  unlocked_stage_ids_by_chapter jsonb not null default '{}'::jsonb,
  completed_stage_ids_by_chapter jsonb not null default '{}'::jsonb,
  current_chapter_id text,
  current_stage_id text,
  updated_at timestamptz not null default now(),
  constraint user_progress_user_difficulty_unique unique (user_id, difficulty)
);

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  type text not null,
  amount integer not null,
  reason text not null,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists reward_ledger_user_type_source_unique_idx
  on public.reward_ledger (user_id, type, source_id)
  where source_id is not null;

create table if not exists public.ad_reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  ad_event_id text not null,
  status text not null,
  reward_amount integer not null default 5,
  created_at timestamptz not null default now(),
  constraint ad_reward_events_user_event_unique unique (user_id, ad_event_id)
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider text not null,
  provider_order_id text not null,
  product_id text not null,
  status text not null,
  amount_krw integer,
  jelly_amount integer,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_orders_provider_order_unique unique (provider, provider_order_id)
);

create table if not exists public.auth_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  event text not null,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_users_last_login_at_idx
  on public.app_users (last_login_at desc nulls last);

create index if not exists toss_oauth_tokens_user_id_idx
  on public.toss_oauth_tokens (user_id);

create index if not exists toss_oauth_tokens_expires_at_idx
  on public.toss_oauth_tokens (expires_at);

create index if not exists user_progress_user_id_idx
  on public.user_progress (user_id);

create index if not exists user_progress_difficulty_idx
  on public.user_progress (difficulty);

create index if not exists reward_ledger_user_id_created_at_idx
  on public.reward_ledger (user_id, created_at desc);

create index if not exists ad_reward_events_user_id_created_at_idx
  on public.ad_reward_events (user_id, created_at desc);

create index if not exists payment_orders_user_id_created_at_idx
  on public.payment_orders (user_id, created_at desc);

create index if not exists payment_orders_status_idx
  on public.payment_orders (status);

create index if not exists auth_audit_logs_user_id_created_at_idx
  on public.auth_audit_logs (user_id, created_at desc);

drop trigger if exists set_updated_at_on_app_users on public.app_users;
create trigger set_updated_at_on_app_users
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_toss_oauth_tokens on public.toss_oauth_tokens;
create trigger set_updated_at_on_toss_oauth_tokens
before update on public.toss_oauth_tokens
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_user_wallets on public.user_wallets;
create trigger set_updated_at_on_user_wallets
before update on public.user_wallets
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_user_progress on public.user_progress;
create trigger set_updated_at_on_user_progress
before update on public.user_progress
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_payment_orders on public.payment_orders;
create trigger set_updated_at_on_payment_orders
before update on public.payment_orders
for each row
execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.toss_oauth_tokens enable row level security;
alter table public.user_wallets enable row level security;
alter table public.user_progress enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.ad_reward_events enable row level security;
alter table public.payment_orders enable row level security;
alter table public.auth_audit_logs enable row level security;

comment on table public.app_users is 'Client direct writes are denied by default. Expose through Edge Functions or backend APIs only.';
comment on table public.user_wallets is 'Server authoritative wallet snapshot. Client direct writes are denied by default.';
comment on table public.user_progress is 'User progress snapshot. Client direct writes are denied by default.';
comment on table public.reward_ledger is 'Sensitive server-only ledger table. No client select/write policy by default.';
comment on table public.payment_orders is 'Sensitive server-only payment table. No client select/write policy by default.';
comment on table public.auth_audit_logs is 'Sensitive server-only auth audit table. No client select/write policy by default.';
