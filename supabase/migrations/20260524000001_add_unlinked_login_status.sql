alter table public.app_users
  drop constraint app_users_login_status_check;

alter table public.app_users
  add constraint app_users_login_status_check
    check (login_status in ('active', 'revoked', 'unlinked', 'withdrawn', 'blocked'));
