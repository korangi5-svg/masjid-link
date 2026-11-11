create table public.scholar_article_translations (
  article_id uuid not null references public.scholar_articles(id) on delete cascade,
  language text not null check (language in ('ar', 'ur', 'bn', 'fr')),
  title text not null,
  body text not null,
  summary text not null,
  primary key (article_id, language)
);

alter table public.scholar_article_translations enable row level security;
revoke all on public.scholar_article_translations from public, anon, authenticated;
grant select, insert on public.scholar_article_translations to service_role;
