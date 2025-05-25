
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { AuthUser } from "./types";
import { UserTableHeader } from "./UserTableHeader";
import { UserTableRow } from "./UserTableRow";

interface UserTableContentProps {
  users: AuthUser[];
  onViewUser: (user: AuthUser) => void;
}

export function UserTableContent({ users, onViewUser }: UserTableContentProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <UserTableHeader />
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                onViewUser={onViewUser}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
