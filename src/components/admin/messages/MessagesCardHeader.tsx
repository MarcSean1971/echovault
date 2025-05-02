
import { ArrowDownUp, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MessagesCardHeaderProps {
  messageCount: number;
  isMobile: boolean;
}

export function MessagesCardHeader({ messageCount, isMobile }: MessagesCardHeaderProps) {
  return (
    <div className="text-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>Messages ({messageCount})</span>
        <Badge variant="outline" className="ml-2">
          <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
          Sort by Date
        </Badge>
      </div>
      <Button size={isMobile ? "sm" : "default"} variant="outline">
        <Archive className="h-4 w-4 mr-2" />
        Archive Selected
      </Button>
    </div>
  );
}
