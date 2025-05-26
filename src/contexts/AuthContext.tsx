
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { checkProfileCompletion } from '@/utils/profileCompletion';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  whatsapp_number: string | null;
  backup_email: string | null;
  backup_contact: string | null;
}

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean | null;
  userId: string | null;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isProfileComplete: boolean;
  signOut: () => Promise<void>;
  getInitials: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Fetch user profile data from the profiles table
  const fetchProfile = async (userId: string) => {
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
      
      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        
        if (!mounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fetch profile immediately for signed-in users
          setProfileLoaded(false);
          setTimeout(async () => {
            if (!mounted) return;
            const userProfile = await fetchProfile(currentSession.user.id);
            if (mounted) {
              setProfile(userProfile);
              setProfileLoaded(true);
            }
          }, 0);
        } else {
          setProfile(null);
          setProfileLoaded(true);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession?.user?.id);
      
      if (!mounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        setProfileLoaded(false);
        const userProfile = await fetchProfile(currentSession.user.id);
        if (mounted) {
          setProfile(userProfile);
          setProfileLoaded(true);
        }
      } else {
        setProfileLoaded(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Only set isLoaded to true when we have determined both auth state and profile state
  useEffect(() => {
    setIsLoaded(profileLoaded);
  }, [profileLoaded]);

  // Sign out function
  const signOut = async () => {
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Sign out failed",
          description: "There was an issue signing you out: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setProfileLoaded(true); // Reset to loaded state for signed-out users
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account"
      });
      
      // Force a page reload to reset all app state
      window.location.href = "/";
    } catch (error: any) {
      console.error('Error in signOut function:', error);
      toast({
        title: "Sign out failed",
        description: "There was an issue signing you out",
        variant: "destructive"
      });
    }
  };

  // Get user initials for avatar
  const getInitials = (): string => {
    if (!profile) return "U";
    
    const firstInitial = profile.first_name ? profile.first_name[0] : "";
    const lastInitial = profile.last_name ? profile.last_name[0] : "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

  // Check if profile is complete
  const completionStatus = checkProfileCompletion(profile);
  const isProfileComplete = completionStatus.isComplete;

  const value = {
    isLoaded,
    isSignedIn: !!user,
    userId: user?.id || null,
    user,
    session,
    profile,
    isProfileComplete,
    signOut,
    getInitials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
