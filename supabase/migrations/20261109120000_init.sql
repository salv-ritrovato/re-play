-- Re - initial schema
-- Single-owner private archive with public read access.
-- Writes are restricted to the owner through Row Level Security.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.play_status as enum ('backlog', 'playing', 'completed', 'on_hold', 'dropped');
create type public.completion_status as enum ('none', 'main_story', 'completionist');
create type public.image_kind as enum ('screenshot', 'artwork');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (authorization)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'viewer')),
  display_name text,
  created_at timestamptz not null default now()
);

-- Only one owner can ever exist.
create unique index profiles_single_owner on public.profiles ((role)) where role = 'owner';

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'owner'
  );
$$;

-- The very first user created becomes the owner; any later user is a plain viewer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case when exists (select 1 from public.profiles where role = 'owner') then 'viewer' else 'owner' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint genres_name_not_blank check (length(btrim(name)) > 0)
);
create unique index genres_name_lower_key on public.genres (lower(name));

create table public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint platforms_name_not_blank check (length(btrim(name)) > 0)
);
create unique index platforms_name_lower_key on public.platforms (lower(name));

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint tags_name_not_blank check (length(btrim(name)) > 0)
);
create unique index tags_name_lower_key on public.tags (lower(name));

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text,
  description text,
  release_date date,
  developer text,
  publisher text,

  rating numeric(3, 1),
  play_status public.play_status not null default 'backlog',
  completion_status public.completion_status not null default 'none',
  playtime_hours numeric(7, 1),
  started_on date,
  completed_on date,
  reviewed_on date,
  -- Convenience column used for "recently played" sorting.
  last_played_on date generated always as (coalesce(completed_on, started_on)) stored,

  review text,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  notes text,

  cover_path text,
  cover_blur text,
  featured boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint games_title_not_blank check (length(btrim(title)) > 0),
  constraint games_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint games_rating_range check (rating is null or (rating >= 0 and rating <= 10)),
  constraint games_playtime_positive check (playtime_hours is null or playtime_hours >= 0),
  constraint games_dates_order check (completed_on is null or started_on is null or completed_on >= started_on)
);

create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

create index games_created_at_idx on public.games (created_at desc);
create index games_rating_idx on public.games (rating desc nulls last);
create index games_release_date_idx on public.games (release_date desc nulls last);
create index games_last_played_idx on public.games (last_played_on desc nulls last);
create index games_play_status_idx on public.games (play_status);
create index games_completion_status_idx on public.games (completion_status);
create index games_developer_idx on public.games (developer);
create index games_publisher_idx on public.games (publisher);
create index games_featured_idx on public.games (featured) where featured;
create index games_title_trgm_idx on public.games using gin (title gin_trgm_ops);
create index games_developer_trgm_idx on public.games using gin (developer gin_trgm_ops);
create index games_publisher_trgm_idx on public.games using gin (publisher gin_trgm_ops);

-- Join tables -----------------------------------------------------------------
create table public.game_genres (
  game_id uuid not null references public.games (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (game_id, genre_id)
);
create index game_genres_genre_idx on public.game_genres (genre_id);

create table public.game_platforms (
  game_id uuid not null references public.games (id) on delete cascade,
  platform_id uuid not null references public.platforms (id) on delete cascade,
  primary key (game_id, platform_id)
);
create index game_platforms_platform_idx on public.game_platforms (platform_id);

create table public.game_tags (
  game_id uuid not null references public.games (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (game_id, tag_id)
);
create index game_tags_tag_idx on public.game_tags (tag_id);

create table public.game_images (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  kind public.image_kind not null default 'screenshot',
  path text not null,
  blur text,
  width integer,
  height integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index game_images_game_idx on public.game_images (game_id, kind, position);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.genres enable row level security;
alter table public.platforms enable row level security;
alter table public.tags enable row level security;
alter table public.game_genres enable row level security;
alter table public.game_platforms enable row level security;
alter table public.game_tags enable row level security;
alter table public.game_images enable row level security;

-- Profiles: a user can only see their own row; nobody writes through the API.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

-- Public read + owner-only write for every content table.
do $$
declare
  t text;
begin
  foreach t in array array['games', 'genres', 'platforms', 'tags', 'game_genres', 'game_platforms', 'game_tags', 'game_images']
  loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_public_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_owner())', t || '_owner_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_owner()) with check (public.is_owner())', t || '_owner_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_owner())', t || '_owner_delete', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Storage: one public bucket, WebP only (images are processed server-side)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-media', 'game-media', true, 5242880, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "game_media_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'game-media');
create policy "game_media_owner_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'game-media' and public.is_owner());
create policy "game_media_owner_update" on storage.objects
  for update to authenticated using (bucket_id = 'game-media' and public.is_owner())
  with check (bucket_id = 'game-media' and public.is_owner());
create policy "game_media_owner_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'game-media' and public.is_owner());

-- ---------------------------------------------------------------------------
-- Library search (filters + sorting + pagination in one round trip)
-- ---------------------------------------------------------------------------
create or replace function public.library_search(
  p_query text default null,
  p_genres uuid[] default null,
  p_platforms uuid[] default null,
  p_years int[] default null,
  p_min_rating numeric default null,
  p_max_rating numeric default null,
  p_play_status public.play_status[] default null,
  p_completion public.completion_status[] default null,
  p_developer text default null,
  p_publisher text default null,
  p_reviewed_only boolean default false,
  p_sort text default 'added',
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  short_description text,
  release_date date,
  developer text,
  publisher text,
  rating numeric,
  play_status public.play_status,
  completion_status public.completion_status,
  playtime_hours numeric,
  review text,
  reviewed_on date,
  cover_path text,
  cover_blur text,
  created_at timestamptz,
  last_played_on date,
  genres jsonb,
  platforms jsonb,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with filtered as (
    select g.*
    from public.games g
    where (p_query is null or p_query = '' or g.title ilike '%' || p_query || '%'
           or g.developer ilike '%' || p_query || '%' or g.publisher ilike '%' || p_query || '%')
      and (p_genres is null or exists (
            select 1 from public.game_genres gg where gg.game_id = g.id and gg.genre_id = any (p_genres)))
      and (p_platforms is null or exists (
            select 1 from public.game_platforms gp where gp.game_id = g.id and gp.platform_id = any (p_platforms)))
      and (p_years is null or extract(year from g.release_date)::int = any (p_years))
      and (p_min_rating is null or g.rating >= p_min_rating)
      and (p_max_rating is null or g.rating <= p_max_rating)
      and (p_play_status is null or g.play_status = any (p_play_status))
      and (p_completion is null or g.completion_status = any (p_completion))
      and (p_developer is null or g.developer = p_developer)
      and (p_publisher is null or g.publisher = p_publisher)
      and (not p_reviewed_only or (g.review is not null and btrim(g.review) <> ''))
  ),
  counted as (select count(*) as c from filtered)
  select
    f.id, f.slug, f.title, f.short_description, f.release_date, f.developer, f.publisher,
    f.rating, f.play_status, f.completion_status, f.playtime_hours, f.review, f.reviewed_on,
    f.cover_path, f.cover_blur, f.created_at, f.last_played_on,
    coalesce((select jsonb_agg(jsonb_build_object('id', ge.id, 'name', ge.name, 'slug', ge.slug) order by ge.name)
              from public.game_genres gg join public.genres ge on ge.id = gg.genre_id
              where gg.game_id = f.id), '[]'::jsonb) as genres,
    coalesce((select jsonb_agg(jsonb_build_object('id', pl.id, 'name', pl.name, 'slug', pl.slug) order by pl.name)
              from public.game_platforms gp join public.platforms pl on pl.id = gp.platform_id
              where gp.game_id = f.id), '[]'::jsonb) as platforms,
    (select c from counted) as total_count
  from filtered f
  order by
    case when p_sort = 'rating_desc' then f.rating end desc nulls last,
    case when p_sort = 'rating_asc' then f.rating end asc nulls last,
    case when p_sort = 'title' then lower(f.title) end asc,
    case when p_sort = 'release_desc' then f.release_date end desc nulls last,
    case when p_sort = 'release_asc' then f.release_date end asc nulls last,
    case when p_sort = 'played' then f.last_played_on end desc nulls last,
    case when p_sort = 'reviewed' then f.reviewed_on end desc nulls last,
    f.created_at desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Statistics (always computed from real rows)
-- ---------------------------------------------------------------------------
create or replace view public.stats_totals with (security_invoker = true) as
select
  count(*)::int as total_games,
  count(*) filter (where play_status = 'completed')::int as completed,
  count(*) filter (where play_status = 'dropped')::int as dropped,
  count(*) filter (where play_status = 'playing')::int as playing,
  count(*) filter (where play_status = 'backlog')::int as backlog,
  count(*) filter (where play_status = 'on_hold')::int as on_hold,
  count(*) filter (where review is not null and btrim(review) <> '')::int as reviewed,
  round(avg(rating), 2) as average_rating,
  coalesce(sum(playtime_hours), 0) as total_playtime_hours
from public.games;

create or replace view public.stats_genres with (security_invoker = true) as
select ge.id, ge.name, ge.slug, count(gg.game_id)::int as games
from public.genres ge
join public.game_genres gg on gg.genre_id = ge.id
group by ge.id
order by games desc, ge.name;

create or replace view public.stats_platforms with (security_invoker = true) as
select pl.id, pl.name, pl.slug, count(gp.game_id)::int as games
from public.platforms pl
join public.game_platforms gp on gp.platform_id = pl.id
group by pl.id
order by games desc, pl.name;

-- Buckets 0..10 (a 10.0 counts in the top bucket).
create or replace view public.stats_rating_distribution with (security_invoker = true) as
select least(floor(rating), 9)::int as bucket, count(*)::int as games
from public.games
where rating is not null
group by 1
order by 1;

create or replace view public.stats_games_by_year with (security_invoker = true) as
select extract(year from last_played_on)::int as year, count(*)::int as games
from public.games
where last_played_on is not null
group by 1
order by 1;

-- Distinct values for filter dropdowns.
create or replace view public.filter_developers with (security_invoker = true) as
select developer as name, count(*)::int as games from public.games
where developer is not null and btrim(developer) <> '' group by developer order by developer;

create or replace view public.filter_publishers with (security_invoker = true) as
select publisher as name, count(*)::int as games from public.games
where publisher is not null and btrim(publisher) <> '' group by publisher order by publisher;

create or replace view public.filter_years with (security_invoker = true) as
select extract(year from release_date)::int as year, count(*)::int as games from public.games
where release_date is not null group by 1 order by 1 desc;

grant select on public.stats_totals, public.stats_genres, public.stats_platforms,
  public.stats_rating_distribution, public.stats_games_by_year,
  public.filter_developers, public.filter_publishers, public.filter_years to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reference data: common genres and platforms (editable from the CMS)
-- ---------------------------------------------------------------------------
insert into public.genres (name, slug) values
  ('Action', 'action'), ('Adventure', 'adventure'), ('RPG', 'rpg'), ('Strategy', 'strategy'),
  ('Shooter', 'shooter'), ('Platformer', 'platformer'), ('Puzzle', 'puzzle'), ('Simulation', 'simulation'),
  ('Racing', 'racing'), ('Sports', 'sports'), ('Fighting', 'fighting'), ('Horror', 'horror'),
  ('Roguelike', 'roguelike'), ('Metroidvania', 'metroidvania'), ('Visual Novel', 'visual-novel'),
  ('Indie', 'indie')
on conflict do nothing;

insert into public.platforms (name, slug) values
  ('PC', 'pc'), ('PlayStation 5', 'playstation-5'), ('PlayStation 4', 'playstation-4'),
  ('PlayStation 3', 'playstation-3'), ('PlayStation 2', 'playstation-2'), ('PlayStation', 'playstation'),
  ('Xbox Series X|S', 'xbox-series-x-s'), ('Xbox One', 'xbox-one'), ('Xbox 360', 'xbox-360'),
  ('Nintendo Switch', 'nintendo-switch'), ('Wii U', 'wii-u'), ('Wii', 'wii'),
  ('Nintendo 3DS', 'nintendo-3ds'), ('Nintendo DS', 'nintendo-ds'), ('Game Boy Advance', 'game-boy-advance'),
  ('Steam Deck', 'steam-deck'), ('Mobile', 'mobile')
on conflict do nothing;
