create table public.scholar_articles (
 id uuid primary key,
 author_id uuid not null references auth.users(id),
 title text not null,
 body text not null,
 summary text not null,
 tags text[] not null,
 categories text[] not null,
 seo_title text not null,
 seo_description text not null,
 social_drafts jsonb not null,
 published_at timestamptz not null default now()
);
alter table public.scholar_articles enable row level security;
revoke all on public.scholar_articles from public, anon, authenticated;
grant select, insert on public.scholar_articles to service_role;
