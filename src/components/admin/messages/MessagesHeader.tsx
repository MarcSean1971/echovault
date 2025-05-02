
import { MessageSquare } from "lucide-react";

interface MessagesHeaderProps {
  title: string;
  description: string;
}

export function MessagesHeader({ title, description }: MessagesHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        {title}
      </h1>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
