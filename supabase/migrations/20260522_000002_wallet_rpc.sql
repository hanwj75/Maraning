create or replace function public.sync_daily_wallet_refill(
  p_user_id uuid,
  p_today date default current_date
)
returns table (
  user_id uuid,
  jelly integer,
  last_daily_refill_date date,
  updated_at timestamptz,
  refilled boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.user_wallets%rowtype;
  v_previous_jelly integer;
  v_refill_amount integer;
begin
  select *
    into v_wallet
    from public.user_wallets
   where user_wallets.user_id = p_user_id
   for update;

  if not found then
    insert into public.user_wallets (user_id, jelly, last_daily_refill_date)
    values (p_user_id, 20, p_today)
    returning * into v_wallet;

    insert into public.reward_ledger (
      user_id,
      type,
      amount,
      reason,
      source_id,
      metadata
    )
    values (
      p_user_id,
      'grant',
      20,
      'daily_refill',
      'daily_refill:' || p_today::text,
      jsonb_build_object('wallet_action', 'daily_refill')
    )
    on conflict do nothing;

    return query
    select
      v_wallet.user_id,
      v_wallet.jelly,
      v_wallet.last_daily_refill_date,
      v_wallet.updated_at,
      true;
    return;
  end if;

  if v_wallet.last_daily_refill_date is distinct from p_today and v_wallet.jelly < 20 then
    v_previous_jelly := v_wallet.jelly;

    update public.user_wallets
       set jelly = 20,
           last_daily_refill_date = p_today
     where user_wallets.user_id = p_user_id
     returning * into v_wallet;

    v_refill_amount := greatest(0, v_wallet.jelly - v_previous_jelly);

    if v_refill_amount > 0 then
      insert into public.reward_ledger (
        user_id,
        type,
        amount,
        reason,
        source_id,
        metadata
      )
      values (
        p_user_id,
        'grant',
        v_refill_amount,
        'daily_refill',
        'daily_refill:' || p_today::text,
        jsonb_build_object('wallet_action', 'daily_refill')
      )
      on conflict do nothing;
    end if;

    return query
    select
      v_wallet.user_id,
      v_wallet.jelly,
      v_wallet.last_daily_refill_date,
      v_wallet.updated_at,
      true;
    return;
  end if;

  if v_wallet.last_daily_refill_date is distinct from p_today then
    update public.user_wallets
       set last_daily_refill_date = p_today
     where user_wallets.user_id = p_user_id
     returning * into v_wallet;
  end if;

  return query
  select
    v_wallet.user_id,
    v_wallet.jelly,
    v_wallet.last_daily_refill_date,
    v_wallet.updated_at,
    false;
end;
$$;

create or replace function public.consume_wallet_jelly(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_source_id text default null
)
returns table (
  user_id uuid,
  jelly integer,
  updated_at timestamptz,
  consumed boolean,
  duplicate boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.user_wallets%rowtype;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_source_id is not null and exists (
    select 1
      from public.reward_ledger
     where reward_ledger.user_id = p_user_id
       and reward_ledger.type = 'consume'
       and reward_ledger.source_id = p_source_id
  ) then
    select *
      into v_wallet
      from public.user_wallets
     where user_wallets.user_id = p_user_id;

    return query
    select
      v_wallet.user_id,
      v_wallet.jelly,
      v_wallet.updated_at,
      false,
      true;
    return;
  end if;

  select *
    into v_wallet
    from public.user_wallets
   where user_wallets.user_id = p_user_id
   for update;

  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  if v_wallet.jelly < p_amount then
    raise exception 'INSUFFICIENT_JELLY';
  end if;

  update public.user_wallets
     set jelly = jelly - p_amount
   where user_wallets.user_id = p_user_id
   returning * into v_wallet;

  begin
    insert into public.reward_ledger (
      user_id,
      type,
      amount,
      reason,
      source_id,
      metadata
    )
    values (
      p_user_id,
      'consume',
      -p_amount,
      p_reason,
      p_source_id,
      jsonb_build_object('wallet_action', 'consume')
    );
  exception
    when unique_violation then
      select *
        into v_wallet
        from public.user_wallets
       where user_wallets.user_id = p_user_id;

      return query
      select
        v_wallet.user_id,
        v_wallet.jelly,
        v_wallet.updated_at,
        false,
        true;
      return;
  end;

  return query
  select
    v_wallet.user_id,
    v_wallet.jelly,
    v_wallet.updated_at,
    true,
    false;
end;
$$;

create or replace function public.grant_wallet_jelly(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_source_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  user_id uuid,
  jelly integer,
  updated_at timestamptz,
  granted boolean,
  duplicate boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.user_wallets%rowtype;
  v_delta integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if p_source_id is not null and exists (
    select 1
      from public.reward_ledger
     where reward_ledger.user_id = p_user_id
       and reward_ledger.type = 'grant'
       and reward_ledger.source_id = p_source_id
  ) then
    select *
      into v_wallet
      from public.user_wallets
     where user_wallets.user_id = p_user_id;

    return query
    select
      v_wallet.user_id,
      v_wallet.jelly,
      v_wallet.updated_at,
      false,
      true;
    return;
  end if;

  insert into public.user_wallets (user_id, jelly)
  values (p_user_id, least(100, greatest(0, p_amount)))
  on conflict (user_id) do nothing;

  select *
    into v_wallet
    from public.user_wallets
   where user_wallets.user_id = p_user_id
   for update;

  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  v_delta := least(100, v_wallet.jelly + p_amount) - v_wallet.jelly;

  update public.user_wallets
     set jelly = least(100, jelly + p_amount)
   where user_wallets.user_id = p_user_id
   returning * into v_wallet;

  begin
    insert into public.reward_ledger (
      user_id,
      type,
      amount,
      reason,
      source_id,
      metadata
    )
    values (
      p_user_id,
      'grant',
      v_delta,
      p_reason,
      p_source_id,
      coalesce(p_metadata, '{}'::jsonb)
    );
  exception
    when unique_violation then
      select *
        into v_wallet
        from public.user_wallets
       where user_wallets.user_id = p_user_id;

      return query
      select
        v_wallet.user_id,
        v_wallet.jelly,
        v_wallet.updated_at,
        false,
        true;
      return;
  end;

  return query
  select
    v_wallet.user_id,
    v_wallet.jelly,
    v_wallet.updated_at,
    true,
    false;
end;
$$;

revoke all on function public.sync_daily_wallet_refill(uuid, date) from public, anon, authenticated;
revoke all on function public.consume_wallet_jelly(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.grant_wallet_jelly(uuid, integer, text, text, jsonb) from public, anon, authenticated;

grant execute on function public.sync_daily_wallet_refill(uuid, date) to service_role;
grant execute on function public.consume_wallet_jelly(uuid, integer, text, text) to service_role;
grant execute on function public.grant_wallet_jelly(uuid, integer, text, text, jsonb) to service_role;
