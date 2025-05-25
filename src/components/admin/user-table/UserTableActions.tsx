
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Lock, UserX, MoreVertical } from "lucide-react";
import { useHoverEffects } from "@/hooks/useHoverEffects";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { AuthUser } from "./types";

interface UserTableActionsProps {
  user: AuthUser;
  onViewUser: (user: AuthUser) => void;
  onUserDeleted: (userId: string) => void;
}

export function UserTableActions({ user, onViewUser, onUserDeleted }: UserTableActionsProps) {
  const { getButtonHoverClasses, getIconHoverClasses } = useHoverEffects();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className={getButtonHoverClasses('ghost')}
                >
                  <MoreVertical className={`h-4 w-4 ${getIconHoverClasses('muted')}`} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Actions</p>
            </TooltipContent>
          </Tooltip>
          
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewUser(user)}>
              <Eye className="h-4 w-4 mr-2" />
              View user details
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Lock className="h-4 w-4 mr-2" />
              Lock user account
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        user={user}
        onUserDeleted={onUserDeleted}
      />
    </>
  );
}
