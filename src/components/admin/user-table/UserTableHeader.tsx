
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function UserTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>User</TableHead>
        <TableHead className="hidden md:table-cell">Email Status</TableHead>
        <TableHead className="hidden lg:table-cell">Profile</TableHead>
        <TableHead className="hidden md:table-cell">Last Sign In</TableHead>
        <TableHead className="hidden lg:table-cell">Created</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
