
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Lock, UserX } from "lucide-react";
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
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onViewUser(user)}
              className={getButtonHoverClasses('ghost')}
            >
              <Eye className={`h-4 w-4 ${getIconHoverClasses('muted')}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View user details</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost"
              className={getButtonHoverClasses('ghost')}
            >
              <Lock className={`h-4 w-4 ${getIconHoverClasses('muted')}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Lock user account</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost"
              className={getButtonHoverClasses('ghost')}
            >
              <UserX className={`h-4 w-4 ${getIconHoverClasses('muted')}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete user</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
