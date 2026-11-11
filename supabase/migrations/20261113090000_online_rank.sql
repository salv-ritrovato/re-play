-- The rank reached in an online / competitive game (free text: "Diamond", "Legend", "Gladiator"...),
-- or "None" when the game has no ranking. Only online games can have one.

alter table public.games add column rank text;

alter table public.games
  add constraint games_rank_not_blank check (rank is null or length(btrim(rank)) > 0),
  add constraint games_rank_length check (rank is null or length(rank) <= 40),
  add constraint games_rank_online_only check (rank is null or is_online);
