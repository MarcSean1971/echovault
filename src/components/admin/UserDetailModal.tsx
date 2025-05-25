
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, User, Mail, Calendar, Clock, AlertTriangle } from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  has_profile: boolean;
  profile_complete: boolean;
  first_name: string | null;
  last_name: string | null;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  backup_email?: string | null;
  backup_contact?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

export default function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [activityData, setActivityData] = useState<any>(null);
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

  const getUserInitials = () => {
    if (!user) return "U";
    
    if (user.first_name && user.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    } else if (user.first_name) {
      return user.first_name[0].toUpperCase();
    } else if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserFullName = () => {
    if (!user) return "Unknown User";
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else {
      return user.email || "User";
    }
  };

  const getProfileStatusBadge = () => {
    if (!user?.has_profile) {
      return <Badge variant="secondary">Profile Not Started</Badge>;
    } else if (user.profile_complete) {
      return <Badge variant="default">Profile Complete</Badge>;
    } else {
      return <Badge variant="destructive">Profile Incomplete</Badge>;
    }
  };

  const getMissingFields = () => {
    if (!user?.has_profile) {
      return ['Profile setup required'];
    }
    
    const missing = [];
    if (!user.first_name) missing.push('First name');
    if (!user.last_name) missing.push('Last name');
    if (!profileData?.email) missing.push('Email in profile');
    
    return missing;
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {profileData?.avatar_url ? (
                <AvatarImage src={profileData.avatar_url} alt={getUserFullName()} />
              ) : null}
              <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="text-lg font-medium">{getUserFullName()}</h3>
              <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user.email_confirmed_at ? "default" : "destructive"}>
                  {user.email_confirmed_at ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Email Verified</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Email Unverified</>
                  )}
                </Badge>
                {getProfileStatusBadge()}
              </div>
            </div>
          </div>

          {/* Profile Completion Status */}
          {!user.profile_complete && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Profile Incomplete</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Missing: {getMissingFields().join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Auth Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Authentication Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">Email Confirmed:</span>{' '}
                  {user.email_confirmed_at ? (
                    <span className="text-green-600">
                      {format(new Date(user.email_confirmed_at), 'PPpp')}
                    </span>
                  ) : (
                    <span className="text-red-600">Not confirmed</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Last Sign In:</span>{' '}
                  {user.last_sign_in_at ? (
                    format(new Date(user.last_sign_in_at), 'PPpp')
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Timeline
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Account Created:</span>{' '}
                  {format(new Date(user.created_at), 'PPpp')}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{' '}
                  {format(new Date(user.updated_at), 'PPpp')}
                </div>
                {profileData && (
                  <div>
                    <span className="font-medium">Profile Created:</span>{' '}
                    {format(new Date(profileData.created_at), 'PPpp')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          {user.has_profile && profileData ? (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  {profileData.backup_email && (
                    <div>
                      <span className="font-medium">Backup Email:</span> {profileData.backup_email}
                    </div>
                  )}
                  {profileData.backup_contact && (
                    <div>
                      <span className="font-medium">Backup Contact:</span> {profileData.backup_contact}
                    </div>
                  )}
                  {profileData.whatsapp_number && (
                    <div>
                      <span className="font-medium">WhatsApp:</span> {profileData.whatsapp_number}
                    </div>
                  )}
                </div>
              </div>
              {!profileData.backup_email && !profileData.backup_contact && !profileData.whatsapp_number && (
                <p className="text-sm text-muted-foreground">No additional contact information available</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Information
              </h4>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  This user has not completed their profile setup yet.
                </p>
              </div>
            </div>
          )}

          {/* Activity Data */}
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-pulse text-primary font-medium">Loading activity data...</div>
            </div>
          ) : activityData ? (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                User Activity
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-2xl font-bold">{activityData.messagesCount}</p>
                </div>
                <div className="rounded-md border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <p className="text-2xl font-bold">{activityData.recipientsCount}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
