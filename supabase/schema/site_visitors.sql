create table public.site_visitors (
  visitor_hash text primary key check (visitor_hash ~ '^[a-f0-9]{64}$')
);
alter table public.site_visitors enable row level security;
revoke all on public.site_visitors from public, anon, authenticated;
grant select, insert on public.site_visitors to service_role;
