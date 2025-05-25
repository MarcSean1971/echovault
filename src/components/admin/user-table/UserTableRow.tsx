
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { AuthUser } from "./types";
import { formatName, formatLastSignIn } from "./utils";
import { EmailVerificationBadge, ProfileCompletionBadge } from "./UserTableBadges";
import { UserTableActions } from "./UserTableActions";

interface UserTableRowProps {
  user: AuthUser;
  onViewUser: (user: AuthUser) => void;
}

export function UserTableRow({ user, onViewUser }: UserTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{formatName(user)}</span>
          <span className="text-sm text-muted-foreground md:hidden">{user.email}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-col gap-1">
          <span className="text-sm">{user.email}</span>
          <EmailVerificationBadge user={user} />
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <ProfileCompletionBadge user={user} />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatLastSignIn(user.last_sign_in_at)}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {format(new Date(user.created_at), 'PP')}
      </TableCell>
      <TableCell>
        <UserTableActions user={user} onViewUser={onViewUser} />
      </TableCell>
    </TableRow>
  );
}
