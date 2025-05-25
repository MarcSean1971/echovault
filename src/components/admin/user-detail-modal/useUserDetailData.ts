
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthUser, UserProfile, ActivityData } from "./types";

export function useUserDetailData(isOpen: boolean, user: AuthUser | null) {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails(user.id);
    } else {
      setProfileData(null);
      setActivityData(null);
    }
  }, [isOpen, user]);

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch profile data if user has a profile
      if (user?.has_profile) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        setProfileData(profile);
      }

      // Fetch user's messages count
      const { count: messagesCount, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (messagesError) throw messagesError;

      // Fetch user's recipients count
      const { count: recipientsCount, error: recipientsError } = await supabase
        .from('recipients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (recipientsError) throw recipientsError;

      setActivityData({
        messagesCount: messagesCount || 0,
        recipientsCount: recipientsCount || 0,
      });
    } catch (err) {
      console.error("Error fetching user details:", err);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, profileData, activityData };
}
