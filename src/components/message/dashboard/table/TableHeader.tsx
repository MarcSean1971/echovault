
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MessageTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Message</TableHead>
        <TableHead>Trigger Type</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Recipients</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
