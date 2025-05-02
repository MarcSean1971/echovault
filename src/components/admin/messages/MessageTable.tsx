
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminMessage } from "@/types/admin";

interface MessageTableProps {
  messages: AdminMessage[];
}

export function MessageTable({ messages }: MessageTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox />
          </TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Condition</TableHead>
          <TableHead>Sender</TableHead>
          <TableHead>Recipients</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.map(message => (
          <TableRow key={message.id}>
            <TableCell>
              <Checkbox id={`select-${message.id}`} />
            </TableCell>
            <TableCell>
              <div className="font-medium">{message.title}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{message.condition}</Badge>
            </TableCell>
            <TableCell>
              <div className="max-w-[200px] truncate text-sm">{message.sender}</div>
            </TableCell>
            <TableCell>
              <div className="max-w-[200px] truncate text-sm">
                {message.recipients.join(", ")}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={message.status.toLowerCase() as any}>
                {message.status}
              </StatusBadge>
            </TableCell>
            <TableCell>{message.createdAt}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Message</DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Delete Message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
