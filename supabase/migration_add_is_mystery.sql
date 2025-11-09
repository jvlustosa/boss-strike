-- Migration: Add is_mystery column to skins table
-- This allows skins to be hidden with a question mark until unlocked

-- Add is_mystery column
ALTER TABLE public.skins 
ADD COLUMN IF NOT EXISTS is_mystery BOOLEAN DEFAULT false;

-- Update existing skins: mark some as mystery based on rarity or specific criteria
-- You can customize this query to mark specific skins as mystery
-- Example: Mark legendary and mythic skins without unlock conditions as mystery
UPDATE public.skins
SET is_mystery = true
WHERE (rarity = 'legendary' OR rarity = 'mythic')
  AND unlock_level IS NULL 
  AND unlock_victories IS NULL
  AND is_default = false
  AND is_mystery = false;

-- Add comment to column
COMMENT ON COLUMN public.skins.is_mystery IS 'If true, skin details are hidden with question mark until unlocked';

