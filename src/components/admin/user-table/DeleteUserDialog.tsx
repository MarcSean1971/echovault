
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useHoverEffects } from "@/hooks/useHoverEffects";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from "./types";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onUserDeleted: (userId: string) => void;
}

export function DeleteUserDialog({ isOpen, onClose, user, onUserDeleted }: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { getButtonHoverClasses } = useHoverEffects();

  const handleDeleteUser = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Call the database function to delete user completely
      const { error } = await supabase.rpc('delete_user_completely', {
        target_user_id: user.id
      });

      if (error) {
        console.error("Error deleting user:", error);
        throw error;
      }

      toast({
        title: "User deleted",
        description: `${user.first_name || 'User'} ${user.last_name || ''} has been permanently deleted.`,
      });

      onUserDeleted(user.id);
      onClose();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to permanently delete the account for{" "}
              <span className="font-semibold">
                {user.first_name || 'Unknown'} {user.last_name || 'User'}
              </span>{" "}
              ({user.email})?
            </p>
            <p className="text-destructive font-medium">
              This action cannot be undone. This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>User profile and account</li>
              <li>All messages and message conditions</li>
              <li>All recipients and contacts</li>
              <li>Check-in history and locations</li>
              <li>Reminder schedules and delivery logs</li>
              <li>All other user data</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isDeleting}
            className={getButtonHoverClasses('outline')}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteUser}
            disabled={isDeleting}
            className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 ${getButtonHoverClasses('destructive')}`}
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
