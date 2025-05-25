
import { Button } from "@/components/ui/button";
import { Eye, Lock, UserX } from "lucide-react";
import { AuthUser } from "./types";

interface UserTableActionsProps {
  user: AuthUser;
  onViewUser: (user: AuthUser) => void;
}

export function UserTableActions({ user, onViewUser }: UserTableActionsProps) {
  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => onViewUser(user)}
        className="hover:bg-primary/10 transition-colors"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button 
        size="sm" 
        variant="ghost"
        className="hover:bg-primary/10 transition-colors"
      >
        <Lock className="h-4 w-4" />
      </Button>
      <Button 
        size="sm" 
        variant="ghost"
        className="hover:bg-primary/10 transition-colors"
      >
        <UserX className="h-4 w-4" />
      </Button>
    </div>
  );
}
