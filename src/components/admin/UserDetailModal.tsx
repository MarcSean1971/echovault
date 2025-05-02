
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData(user.id);
    } else {
      setUserData(null);
    }
  }, [isOpen, user]);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      
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

      setUserData({
        messagesCount: messagesCount || 0,
        recipientsCount: recipientsCount || 0,
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
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
    const firstInitial = user.first_name ? user.first_name[0] : "";
    const lastInitial = user.last_name ? user.last_name[0] : "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

  const getUserFullName = () => {
    if (!user) return "Unknown User";
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else {
      return "User";
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {user.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={getUserFullName()} />
              ) : null}
              <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-lg font-medium">{getUserFullName()}</h3>
              <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
            </div>
          </div>

          {/* User Data */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Contact Information</p>
                <div className="space-y-2 mt-1">
                  {user.backup_email && (
                    <p className="text-sm">Email: {user.backup_email}</p>
                  )}
                  {user.backup_contact && (
                    <p className="text-sm">Contact: {user.backup_contact}</p>
                  )}
                  {user.whatsapp_number && (
                    <p className="text-sm">WhatsApp: {user.whatsapp_number}</p>
                  )}
                  {!user.backup_email && !user.backup_contact && !user.whatsapp_number && (
                    <p className="text-sm text-muted-foreground">No contact information available</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">User Since</p>
                <p className="text-sm">{format(new Date(user.created_at), 'PPpp')}</p>
                
                <p className="text-sm font-medium mt-2">Last Active</p>
                <p className="text-sm">{format(new Date(user.updated_at), 'PPpp')}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-pulse text-primary font-medium">Loading activity data...</div>
              </div>
            ) : userData ? (
              <div>
                <p className="text-sm font-medium">User Activity</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Messages</p>
                    <p className="text-2xl font-bold">{userData.messagesCount}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Recipients</p>
                    <p className="text-2xl font-bold">{userData.recipientsCount}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
