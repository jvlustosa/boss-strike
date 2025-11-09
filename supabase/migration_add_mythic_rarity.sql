-- ============================================================================
-- MIGRATION: Add 'mythic' rarity type
-- Run this to update existing database to support mythic rarity
-- ============================================================================

-- Drop the old constraint
ALTER TABLE public.skins 
DROP CONSTRAINT IF EXISTS skins_rarity_check;

-- Add new constraint with 'mythic' included
ALTER TABLE public.skins 
ADD CONSTRAINT skins_rarity_check 
CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic'));

