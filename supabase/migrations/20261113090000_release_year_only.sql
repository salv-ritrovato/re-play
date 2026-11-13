-- A release date known only by its year: the date is the 1st of January and this flag says that the day and the
-- month mean nothing (the site then shows just the year). It tells apart a game released in "1997" from one
-- really released on 1 January.
alter table public.games add column if not exists release_year_only boolean not null default false;

-- The one game entered this way so far.
update public.games set release_year_only = true where slug = 'jurassic-war' and release_date = date '1997-01-01';
