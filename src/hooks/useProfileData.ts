
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProfile, updateProfile, ProfileData, ProfileUpdateData } from "@/services/profileService";
import { toast } from "@/components/ui/use-toast";
import { ProfileFormValues } from "@/components/profile/ProfileForm";

export function useProfileData() {
  const { userId, getInitials } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const profileData = await fetchProfile(userId);
        
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [userId]);

  // Handle form submission
  const handleSubmit = async (values: ProfileFormValues) => {
    if (!userId) return;
    
    try {
      const updateData: ProfileUpdateData = {
        first_name: values.first_name,
        last_name: values.last_name,
        backup_email: values.backup_email || null,
        whatsapp_number: values.whatsapp_number || null,
        backup_contact: values.backup_contact || null,
      };
      
      const updatedProfile = await updateProfile(userId, updateData);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile",
        variant: "destructive",
      });
    }
  };

  // Handle avatar update
  const handleAvatarUpdate = (avatarUrl: string) => {
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: avatarUrl
      });
    }
  };

  // Get user initials for avatar
  const initials = profile ? 
    `${(profile.first_name?.[0] || "")}${(profile.last_name?.[0] || "")}`.toUpperCase() : 
    getInitials();

  return { profile, isLoading, handleSubmit, initials, handleAvatarUpdate };
}
