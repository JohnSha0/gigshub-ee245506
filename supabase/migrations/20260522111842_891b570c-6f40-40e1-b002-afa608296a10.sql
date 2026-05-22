
-- ============ ENUMS ============
create type public.app_role as enum ('student', 'provider');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  phone text,
  location text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "Users can assign themselves a role"
  on public.user_roles for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove their own roles"
  on public.user_roles for delete to authenticated
  using (user_id = auth.uid());

-- ============ SKILLS MASTER LIST ============
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  category text
);

alter table public.skills enable row level security;

create policy "Skills are public to authenticated users"
  on public.skills for select to authenticated using (true);

-- Seed skills
insert into public.skills (name, slug, category) values
  ('Tuition', 'tuition', 'Tuition'),
  ('Canva / Graphic Design', 'design', 'Design'),
  ('Video Editing', 'video-editing', 'Design'),
  ('Tech Support', 'tech-support', 'Tech'),
  ('Retail Help', 'retail-help', 'Retail'),
  ('Event Management', 'event-management', 'Events'),
  ('Excel / Data Entry', 'excel', 'Tech'),
  ('Physics', 'physics', 'Tuition');

-- ============ PROFILE SKILLS ============
create table public.profile_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (profile_id, skill_id)
);

alter table public.profile_skills enable row level security;

create policy "Profile skills viewable by authenticated"
  on public.profile_skills for select to authenticated using (true);

create policy "Users manage their own profile skills - insert"
  on public.profile_skills for insert to authenticated
  with check (profile_id = auth.uid());

create policy "Users manage their own profile skills - delete"
  on public.profile_skills for delete to authenticated
  using (profile_id = auth.uid());

-- ============ GIGS ============
create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  title text not null,
  category text not null,
  pay_text text not null,
  duration text,
  location text not null,
  description text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.gigs enable row level security;
create index gigs_created_at_idx on public.gigs (created_at desc);
create index gigs_provider_idx on public.gigs (provider_id);

create policy "Gigs viewable by authenticated"
  on public.gigs for select to authenticated using (true);

create policy "Providers create their own gigs"
  on public.gigs for insert to authenticated
  with check (provider_id = auth.uid());

create policy "Providers update their own gigs"
  on public.gigs for update to authenticated
  using (provider_id = auth.uid()) with check (provider_id = auth.uid());

create policy "Providers delete their own gigs"
  on public.gigs for delete to authenticated
  using (provider_id = auth.uid());

-- ============ GIG TAGS ============
create table public.gig_tags (
  gig_id uuid not null references public.gigs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (gig_id, skill_id)
);

alter table public.gig_tags enable row level security;

create policy "Gig tags viewable by authenticated"
  on public.gig_tags for select to authenticated using (true);

create policy "Gig owners insert tags"
  on public.gig_tags for insert to authenticated
  with check (exists (select 1 from public.gigs g where g.id = gig_id and g.provider_id = auth.uid()));

create policy "Gig owners delete tags"
  on public.gig_tags for delete to authenticated
  using (exists (select 1 from public.gigs g where g.id = gig_id and g.provider_id = auth.uid()));

-- ============ APPLICATIONS ============
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  student_id uuid not null,
  status text not null default 'applied',
  created_at timestamptz not null default now(),
  unique (gig_id, student_id)
);

alter table public.applications enable row level security;
create index applications_student_idx on public.applications (student_id);
create index applications_gig_idx on public.applications (gig_id);

create policy "Students see their own applications"
  on public.applications for select to authenticated
  using (student_id = auth.uid()
    or exists (select 1 from public.gigs g where g.id = gig_id and g.provider_id = auth.uid()));

create policy "Students create their own applications"
  on public.applications for insert to authenticated
  with check (student_id = auth.uid());

-- ============ CONNECTIONS ============
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  provider_id uuid not null,
  student_id uuid not null,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  unique (gig_id, provider_id, student_id)
);

alter table public.connections enable row level security;
create index connections_provider_idx on public.connections (provider_id);
create index connections_student_idx on public.connections (student_id);

create policy "Providers and students see their connections"
  on public.connections for select to authenticated
  using (provider_id = auth.uid() or student_id = auth.uid());

create policy "Providers create connections from their own gigs"
  on public.connections for insert to authenticated
  with check (provider_id = auth.uid()
    and exists (select 1 from public.gigs g where g.id = gig_id and g.provider_id = auth.uid()));

-- ============ THREADS ============
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  student_id uuid not null,
  provider_id uuid not null,
  created_at timestamptz not null default now(),
  unique (gig_id, student_id, provider_id)
);

alter table public.threads enable row level security;
create index threads_student_idx on public.threads (student_id);
create index threads_provider_idx on public.threads (provider_id);

create policy "Participants can view threads"
  on public.threads for select to authenticated
  using (student_id = auth.uid() or provider_id = auth.uid());

create policy "Participants can insert threads"
  on public.threads for insert to authenticated
  with check (student_id = auth.uid() or provider_id = auth.uid());

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
create index messages_thread_idx on public.messages (thread_id, created_at);

create policy "Participants can read messages"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.threads t
    where t.id = thread_id
      and (t.student_id = auth.uid() or t.provider_id = auth.uid())
  ));

create policy "Participants can send messages"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (
    select 1 from public.threads t
    where t.id = thread_id
      and (t.student_id = auth.uid() or t.provider_id = auth.uid())
  ));

-- ============ REALTIME ============
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.connections;

-- ============ UPDATED_AT TRIGGER ============
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(coalesce(new.email, new.phone, 'New User'), '@', 1)
  );

  insert into public.profiles (id, display_name, phone)
  values (new.id, v_display_name, new.phone)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
