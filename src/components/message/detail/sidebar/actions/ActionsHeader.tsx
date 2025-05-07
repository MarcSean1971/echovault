
import { Bell } from "lucide-react";

interface ActionsHeaderProps {
  title?: string;
}

export function ActionsHeader({ title = "Actions" }: ActionsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">{title}</h3>
      <Bell className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
