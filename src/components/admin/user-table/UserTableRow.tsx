
import { TableCell, TableRow } from "@/components/ui/table";
import { UserTableActions } from "./UserTableActions";
import { UserTableBadges } from "./UserTableBadges";
import { AuthUser } from "./types";
import { formatDistanceToNow } from "date-fns";

interface UserTableRowProps {
  user: AuthUser;
  onViewUser: (user: AuthUser) => void;
  onUserDeleted: (userId: string) => void;
}

export function UserTableRow({ user, onViewUser, onUserDeleted }: UserTableRowProps) {
  return (
    <TableRow key={user.id}>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">
            {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : 'No name set'
            }
          </div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </TableCell>
      
      <TableCell>
        <UserTableBadges user={user} />
      </TableCell>
      
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
      </TableCell>
      
      <TableCell className="text-sm text-muted-foreground">
        {user.last_sign_in_at 
          ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
          : 'Never'
        }
      </TableCell>
      
      <TableCell className="text-right">
        <UserTableActions 
          user={user} 
          onViewUser={onViewUser}
          onUserDeleted={onUserDeleted}
        />
      </TableCell>
    </TableRow>
  );
}
