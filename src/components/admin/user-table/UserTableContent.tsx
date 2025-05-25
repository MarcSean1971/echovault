
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserTableRow } from "./UserTableRow";
import { AuthUser } from "./types";

interface UserTableContentProps {
  users: AuthUser[];
  onViewUser: (user: AuthUser) => void;
  onUserDeleted: (userId: string) => void;
}

export function UserTableContent({ users, onViewUser, onUserDeleted }: UserTableContentProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Sign In</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <UserTableRow
            key={user.id}
            user={user}
            onViewUser={onViewUser}
            onUserDeleted={onUserDeleted}
          />
        ))}
      </TableBody>
    </Table>
  );
}
