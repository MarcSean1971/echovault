
import { MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminMessage } from "@/types/admin";

interface MessageMobileCardProps {
  message: AdminMessage;
}

export function MessageMobileCard({ message }: MessageMobileCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Checkbox id={`select-${message.id}`} />
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>
        <StatusBadge status={message.status.toLowerCase() as any}>
          {message.status}
        </StatusBadge>
      </div>
      
      <h3 className="font-medium mb-1">{message.title}</h3>
      <p className="text-xs text-muted-foreground mb-2">From: {message.sender}</p>
      
      <div className="text-xs mb-3">
        <span className="text-muted-foreground">To: </span>
        {message.recipients.join(", ")}
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <Badge variant="outline">{message.condition}</Badge>
        <span className="text-xs text-muted-foreground">Created: {message.createdAt}</span>
      </div>
      
      <div className="flex justify-end mt-3 gap-2">
        <Button size="sm" variant="ghost">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
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
            <DropdownMenuItem className="text-destructive">Delete Message</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
