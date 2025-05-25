import { supabase } from "@/integrations/supabase/client";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { getAvailableBucketName } from "@/services/messages/fileService";

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  backup_email?: string | null;
  whatsapp_number?: string | null;
  backup_contact?: string | null;
  avatar_url?: string | null;
}

export interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
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
    
    // Add default values for potentially missing fields
    const profileData: ProfileData = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      avatar_url: data.avatar_url,
      backup_email: data.backup_email || null,
      whatsapp_number: data.whatsapp_number || null,
      backup_contact: data.backup_contact || null
    };
    
    return profileData;
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

    // Add default values for potentially missing fields
    const updatedProfile: ProfileData = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      avatar_url: data.avatar_url,
      backup_email: data.backup_email || null,
      whatsapp_number: data.whatsapp_number || null,
      backup_contact: data.backup_contact || null
    };

    return updatedProfile;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return null;
  }
}

// Upload profile avatar
export async function uploadProfileAvatar(file: File): Promise<string | null> {
  try {
    // Make sure we have a valid user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }
    
    const userId = session.user.id;
    const bucket = await getAvailableBucketName();
    
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/avatar/${fileName}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    // Update the user's profile with the new avatar URL
    await updateProfile(userId, {
      avatar_url: urlData.publicUrl
    });
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading profile avatar:', error);
    return null;
  }
}
