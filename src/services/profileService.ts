
import { supabase } from "@/integrations/supabase/client";

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  backup_email?: string;
  whatsapp_number?: string;
  backup_contact?: string;
}

export interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  backup_email: string | null;
  whatsapp_number: string | null;
  backup_contact: string | null;
}

// Fetch profile data
export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data as ProfileData;
  } catch (error) {
    console.error('Error in fetchProfile:', error);
    return null;
  }
}

// Update profile information
export async function updateProfile(
  userId: string,
  profileData: ProfileUpdateData
): Promise<ProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data as ProfileData;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return null;
  }
}
