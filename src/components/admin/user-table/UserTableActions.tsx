
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
import { AuthUser } from "./types";

interface UserTableActionsProps {
  user: AuthUser;
  onViewUser: (user: AuthUser) => void;
}

export function UserTableActions({ user, onViewUser }: UserTableActionsProps) {
  const { getButtonHoverClasses, getIconHoverClasses } = useHoverEffects();

  return (
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
          
          <DropdownMenuItem>
            <UserX className="h-4 w-4 mr-2" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
