-- Remove personal notes and the screenshots / additional artwork feature.
-- The cover stays on games.cover_path / cover_blur (public 'game-media' bucket).

drop table public.game_images;
drop type public.image_kind;

alter table public.games drop column notes;
