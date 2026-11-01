-- Discussion content is written only by authenticated server routes using the service key.
create table public.discussion_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.discussion_posts(id) on delete cascade,
  body text not null check (char_length(body) between 10 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','held','rejected')),
  moderation jsonb not null default '{"source":"fallback","flags":[],"reason":"Awaiting moderator review"}',
  appealed boolean not null default false,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text not null default '' check (char_length(review_note) <= 300),
  revision integer not null default 0,
  created_at timestamptz not null default now()
);
create index discussion_status_created on public.discussion_posts(status, created_at);
create index discussion_author_created on public.discussion_posts(author_id, created_at);
create index discussion_parent_created on public.discussion_posts(parent_id, created_at);
alter table public.discussion_posts enable row level security;
-- Read via server as well, so children of a hidden root never leak through direct REST reads.
revoke all on public.discussion_posts from anon, authenticated;
grant all on public.discussion_posts to service_role;

create table public.discussion_moderation_events (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.discussion_posts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  status text not null,
  moderation jsonb not null,
  appealed boolean not null,
  review_note text not null,
  created_at timestamptz not null default now()
);
alter table public.discussion_moderation_events enable row level security;
revoke all on public.discussion_moderation_events from anon, authenticated;
grant all on public.discussion_moderation_events to service_role;
grant usage, select on sequence public.discussion_moderation_events_id_seq to service_role;

create function public.audit_discussion_moderation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.discussion_moderation_events(post_id,actor_id,status,moderation,appealed,review_note)
  values(new.id,new.reviewed_by,new.status,new.moderation,new.appealed,new.review_note);
  return new;
end;
$$;
create trigger discussion_moderation_audit after insert or update on public.discussion_posts
for each row execute function public.audit_discussion_moderation();

-- Serialize per-author admission before calling AI: limits survive restarts and concurrent requests.
create function public.submit_discussion_post(p_author uuid, p_body text, p_parent uuid default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare post_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_author::text, 0));
  if (select count(*) from public.discussion_posts where author_id=p_author and created_at > now()-interval '1 day') >= 20
    or exists(select 1 from public.discussion_posts where author_id=p_author and created_at > now()-interval '30 seconds') then
    raise exception 'Discussion submission limit reached' using errcode='P0001';
  end if;
  if exists(select 1 from public.discussion_posts where author_id=p_author and lower(trim(body))=lower(trim(p_body)) and created_at > now()-interval '1 day') then
    raise exception 'Duplicate post' using errcode='P0002';
  end if;
  if p_parent is not null and not exists(select 1 from public.discussion_posts where id=p_parent and status='approved' and parent_id is null) then
    raise exception 'Discussion is unavailable' using errcode='P0003';
  end if;
  insert into public.discussion_posts(author_id,body,parent_id) values(p_author,p_body,p_parent) returning id into post_id;
  return post_id;
end;
$$;
revoke all on function public.submit_discussion_post(uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.submit_discussion_post(uuid,text,uuid) to service_role;
