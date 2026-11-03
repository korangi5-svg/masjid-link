-- Community matching: private preferences and memberships accessed only through server routes.
create table public.community_groups (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  details jsonb not null check (jsonb_typeof(details)='object'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.community_matching_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null check (jsonb_typeof(preferences)='object'),
  updated_at timestamptz not null default now()
);
create table public.community_group_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null references public.community_groups(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(user_id,group_id)
);
create index community_memberships_group on public.community_group_memberships(group_id);
alter table public.community_groups enable row level security;
alter table public.community_matching_preferences enable row level security;
alter table public.community_group_memberships enable row level security;
revoke all on public.community_groups,public.community_matching_preferences,public.community_group_memberships from public,anon,authenticated;
grant all on public.community_groups,public.community_matching_preferences,public.community_group_memberships to service_role;

-- Starter groups
insert into public.community_groups(id,details) values
('quran-circle','{"id":"quran-circle","name":"Quran Learning Circle","description":"Learn Quran together, share a learning intention, and return to a manageable daily practice.","city":"","languages":["English"],"goals":["Learn Quran"],"ages":[],"interests":["quran"],"resource":"/resources#quran"}'::jsonb),
('tafsir-circle','{"id":"tafsir-circle","name":"Tafsir Study Circle","description":"Explore sourced explanations and reflect on Quranic meaning.","city":"","languages":["English","Arabic"],"goals":["Understand tafsir"],"ages":[],"interests":["tafsir","quran"],"resource":"/learn"}'::jsonb),
('new-muslim-circle','{"id":"new-muslim-circle","name":"Foundations Together","description":"A welcoming starter group for learning faith, prayer, and purification at your own pace.","city":"","languages":["English"],"goals":["Build foundations","Build prayer habits"],"ages":[],"interests":["new-muslims"],"resource":"/learning-path"}'::jsonb),
('family-circle','{"id":"family-circle","name":"Faith & Family Circle","description":"Explore practical family learning and parenting resources.","city":"","languages":["English"],"goals":["Support my family"],"ages":[],"interests":["parenting"],"resource":"/learn"}'::jsonb),
('history-circle','{"id":"history-circle","name":"Islamic History Circle","description":"Discover Islamic history and discuss what you are learning.","city":"","languages":["English"],"goals":["Learn Islamic history"],"ages":[],"interests":["islamic-history"],"resource":"/learn"}'::jsonb),
('toronto-learners','{"id":"toronto-learners","name":"Toronto Learning Circle","description":"An on-site circle for learners who choose Toronto, Canada as their city.","city":"Toronto, Canada","languages":["English","Urdu"],"goals":["Learn Quran","Build prayer habits"],"ages":[],"interests":["quran","new-muslims"],"resource":"/masjids"}'::jsonb),
('urdu-circle','{"id":"urdu-circle","name":"Urdu Learning Circle","description":"Find a shared starting point for learning in Urdu.","city":"","languages":["Urdu"],"goals":["Build foundations","Learn Quran"],"ages":[],"interests":["quran","new-muslims"],"resource":"/learn"}'::jsonb),
('french-circle','{"id":"french-circle","name":"French Learning Circle","description":"Connect around shared learning goals in French.","city":"","languages":["French"],"goals":["Learn Quran","Build foundations"],"ages":[],"interests":["quran","new-muslims"],"resource":"/learn"}'::jsonb),
('young-adult-circle','{"id":"young-adult-circle","name":"Young Adult Learning Circle","description":"A starter circle for learners who choose the 18–24 age bracket.","city":"","languages":["English"],"goals":["Build prayer habits","Build foundations"],"ages":["18–24"],"interests":["youth","new-muslims"],"resource":"/learning-path"}'::jsonb),
('lifelong-circle','{"id":"lifelong-circle","name":"Lifelong Learning Circle","description":"A starter circle for learners who choose the 50+ age bracket.","city":"","languages":["English","Urdu"],"goals":["Learn Quran","Understand tafsir"],"ages":["50+"],"interests":["quran","tafsir"],"resource":"/learn"}'::jsonb);
