-- Shared cache of OpenStreetMap masjids so searches don't wait on the public Overpass servers.
-- Written only by the server (secret key); masjid rows are public map data, so anyone may read them.

create table public.osm_masjids (
  osm_type text not null check (osm_type in ('node', 'way', 'relation')),
  osm_id bigint not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  address text not null default '',
  city text not null default '',
  province text not null default '',
  postal_code text not null default '',
  phone text,
  website text,
  description text not null default '',
  services text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (osm_type, osm_id)
);

create index osm_masjids_lat_lng_idx on public.osm_masjids (lat, lng);

alter table public.osm_masjids enable row level security;

create policy "OSM masjids are public"
  on public.osm_masjids for select to anon, authenticated
  using (true);

-- Rectangles whose masjids have been fully fetched from Overpass, and when.
-- A search is answered from osm_masjids alone when fresh coverage spans its whole area.
create table public.osm_coverage (
  id text primary key,
  south double precision not null,
  west double precision not null,
  north double precision not null,
  east double precision not null,
  fetched_at timestamptz not null default now()
);

create index osm_coverage_fetched_at_idx on public.osm_coverage (fetched_at);

-- No policies: only the server's secret key (which bypasses RLS) can read or write coverage.
alter table public.osm_coverage enable row level security;
