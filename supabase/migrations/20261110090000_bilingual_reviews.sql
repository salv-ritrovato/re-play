-- Reviews are written in two languages: English (review_en) and Italian (review_it).
-- A game either has both or neither: a review can't exist in only one language.

alter table public.games rename column review to review_en;
alter table public.games add column review_it text;

alter table public.games
  add constraint games_reviews_both_or_none
  check ((review_en is null) = (review_it is null));

-- library_search returned `review`; its row type changes, so it must be recreated.
drop function public.library_search(
  text, uuid[], uuid[], int[], numeric, numeric,
  public.play_status[], public.completion_status[], text, text, boolean, text, int, int
);

create function public.library_search(
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
  review_en text,
  review_it text,
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
      and (not p_reviewed_only or (g.review_en is not null and btrim(g.review_en) <> ''))
  ),
  counted as (select count(*) as c from filtered)
  select
    f.id, f.slug, f.title, f.short_description, f.release_date, f.developer, f.publisher,
    f.rating, f.play_status, f.completion_status, f.playtime_hours, f.review_en, f.review_it, f.reviewed_on,
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

grant execute on function public.library_search(
  text, uuid[], uuid[], int[], numeric, numeric,
  public.play_status[], public.completion_status[], text, text, boolean, text, int, int
) to anon, authenticated;

-- "Reviewed" now means a review exists (both languages always come together).
create or replace view public.stats_totals with (security_invoker = true) as
select
  count(*)::int as total_games,
  count(*) filter (where play_status = 'completed')::int as completed,
  count(*) filter (where play_status = 'dropped')::int as dropped,
  count(*) filter (where play_status = 'playing')::int as playing,
  count(*) filter (where play_status = 'backlog')::int as backlog,
  count(*) filter (where play_status = 'on_hold')::int as on_hold,
  count(*) filter (where review_en is not null and btrim(review_en) <> '')::int as reviewed,
  round(avg(rating), 2) as average_rating,
  coalesce(sum(playtime_hours), 0) as total_playtime_hours
from public.games;
