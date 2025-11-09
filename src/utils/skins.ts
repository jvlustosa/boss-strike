import { supabase } from './supabase';
import type { Skin, UserSkin, UserSkinWithDetails } from '../utils/supabase-structure';

export async function getAllSkins(): Promise<Skin[]> {
  const { data, error } = await supabase
    .from('skins')
    .select('*')
    .order('rarity', { ascending: false })
    .order('unlock_level', { ascending: true });

  if (error) {
    console.error('Error fetching skins:', error);
    return [];
  }

  return data || [];
}

export async function getUserSkins(userId: string): Promise<UserSkin[]> {
  const { data, error } = await supabase
    .from('user_skins')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user skins:', error);
    return [];
  }

  return data || [];
}

export async function getEquippedSkin(userId: string): Promise<UserSkin | null> {
  const { data, error } = await supabase
    .from('user_skins')
    .select('*')
    .eq('user_id', userId)
    .eq('is_equipped', true)
    .single();

  if (error) {
    console.error('Error fetching equipped skin:', error);
    return null;
  }

  return data;
}

export async function getSelectedSkinWithDetails(userId: string): Promise<UserSkinWithDetails | null> {
  // First get profile to find selected_skin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('selected_skin')
    .eq('id', userId)
    .single();

  if (profileError || !profile?.selected_skin) {
    return null;
  }

  // Then get the user_skin with details
  const { data, error } = await supabase
    .from('user_skins')
    .select(`
      *,
      skin:skins(*)
    `)
    .eq('id', profile.selected_skin)
    .single();

  if (error) {
    console.error('Error fetching selected skin with details:', error);
    return null;
  }

  return data as UserSkinWithDetails;
}

export async function unlockSkin(userId: string, skinId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_skins')
    .insert({
      user_id: userId,
      skin_id: skinId,
      is_equipped: false,
    });

  if (error) {
    console.error('Error unlocking skin:', error);
    return false;
  }

  return true;
}

export async function equipSkin(userId: string, skinId: string): Promise<boolean> {
  // Find the user_skin id for this skin
  const { data: userSkin, error: findError } = await supabase
    .from('user_skins')
    .select('id')
    .eq('user_id', userId)
    .eq('skin_id', skinId)
    .single();

  if (findError || !userSkin) {
    console.error('Error finding user skin:', findError);
    return false;
  }

  // Update profile with selected_skin
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ selected_skin: userSkin.id })
    .eq('id', userId);

  if (updateError) {
    console.error('Error equipping skin:', updateError);
    return false;
  }

  return true;
}

export async function checkAndUnlockSkins(
  userId: string,
  currentLevel: number,
  currentVictories: number
): Promise<Skin[]> {
  const unlockedSkins: Skin[] = [];

  // Get all skins that have unlock conditions (exclude default skin which is unlocked on signup)
  const { data: allSkins, error } = await supabase
    .from('skins')
    .select('*')
    .or(`unlock_level.not.is.null,unlock_victories.not.is.null`);

  if (error) {
    console.error('Error checking unlockable skins:', error);
    return [];
  }

  if (!allSkins) return [];

  // Get already unlocked skins
  const userSkins = await getUserSkins(userId);
  const unlockedSkinIdsSet = new Set(userSkins.map(us => us.skin_id));

  // Filter and unlock skins that meet their requirements
  for (const skin of allSkins) {
    // Skip if already unlocked
    if (unlockedSkinIdsSet.has(skin.id)) continue;

    // Check if skin meets unlock requirements
    const meetsLevelRequirement = skin.unlock_level !== null && currentLevel >= skin.unlock_level;
    const meetsVictoryRequirement = skin.unlock_victories !== null && currentVictories >= skin.unlock_victories;
    
    // Unlock if it meets at least one of its requirements
    const shouldUnlock = meetsLevelRequirement || meetsVictoryRequirement;

    if (shouldUnlock) {
      const unlocked = await unlockSkin(userId, skin.id);
      if (unlocked) {
        unlockedSkins.push(skin as Skin);
      }
    }
  }

  return unlockedSkins;
}

export async function getUserSkinsWithDetails(userId: string): Promise<UserSkinWithDetails[]> {
  const { data, error } = await supabase
    .from('user_skins')
    .select(`
      *,
      skin:skins(*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user skins with details:', error);
    return [];
  }

  return (data || []) as UserSkinWithDetails[];
}

