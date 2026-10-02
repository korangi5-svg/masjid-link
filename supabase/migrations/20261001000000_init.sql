-- Connect to Masjid: initial schema.
-- Apply with `supabase db push`, or paste into the Supabase dashboard SQL editor.

-- Profiles ------------------------------------------------------------------
-- One row per auth user, filled from sign-up metadata by the trigger below.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  location text not null default '' check (char_length(location) <= 100),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, location)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100),
    left(coalesce(new.raw_user_meta_data ->> 'location', ''), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Curated masjids -----------------------------------------------------------
-- Optional listings maintained by the site (search results come from OpenStreetMap).
create table public.masjids (
  id text primary key,
  name text not null,
  address text not null default '',
  city text not null default '',
  province text not null default '',
  postal_code text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  phone text,
  website text,
  description text not null default '',
  services text[] not null default '{}',
  prayer_times jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.masjids enable row level security;

create policy "Masjids are public"
  on public.masjids for select to anon, authenticated
  using (true);

-- Events --------------------------------------------------------------------
create table public.events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null check (category in ('Prayer', 'Education', 'Youth', 'Family', 'Community')),
  date date not null,
  start_time text not null,
  end_time text not null,
  location text not null,
  masjid_id text not null default '',
  description text not null default '',
  details text not null default '',
  created_at timestamptz not null default now()
);

create index events_date_idx on public.events (date);

alter table public.events enable row level security;

create policy "Events are public"
  on public.events for select to anon, authenticated
  using (true);

-- Resources -----------------------------------------------------------------
-- links is an array of { "title", "description", "href" } objects.
create table public.resource_categories (
  id text primary key check (id in ('quran', 'hadith', 'dua', 'articles', 'education')),
  title text not null,
  description text not null default '',
  links jsonb not null default '[]',
  sort_order int not null default 0
);

alter table public.resource_categories enable row level security;

create policy "Resources are public"
  on public.resource_categories for select to anon, authenticated
  using (true);

-- Contact messages ----------------------------------------------------------
-- Anyone may submit; nobody can read them through the API (use the dashboard).
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 200),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can send a contact message"
  on public.contact_messages for insert to anon, authenticated
  with check (true);
