-- New play status for online games that are no longer played every day but still picked up now and then.
-- Existing rows are untouched; the value sits right after "playing" so enum ordering follows how active the game is.
alter type public.play_status add value if not exists 'occasional' after 'playing';
