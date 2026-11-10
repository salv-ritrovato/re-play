-- New completion level between "main story" and "100%": main story plus the side quests.
-- Existing rows are untouched; the value is placed so enum ordering follows the level of completion.
alter type public.completion_status add value if not exists 'main_story_side_quests' before 'completionist';
