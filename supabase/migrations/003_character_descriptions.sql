-- Add character_description to crew_members for storyboard visual consistency
-- This field stores physical appearance details (hair, build, wardrobe, etc.)
-- used to inject consistent character descriptions into image generation prompts.

ALTER TABLE crew_members
  ADD COLUMN IF NOT EXISTS character_description TEXT DEFAULT NULL;

COMMENT ON COLUMN crew_members.character_description IS 'Physical appearance description for AI image generation consistency (e.g. "tall, auburn hair, green eyes, cream knit sweater")';
