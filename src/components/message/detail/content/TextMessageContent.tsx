
import React from "react";
import { Card } from "@/components/ui/card";

interface TextMessageContentProps {
  content: string;
}

export function TextMessageContent({ content }: TextMessageContentProps) {
  // If no content, show placeholder
  if (!content || content.trim() === "") {
    return (
      <div className="p-4 bg-muted/40 rounded-md text-center text-muted-foreground">
        No message content
      </div>
    );
  }
  
  return (
    <Card className="p-4">
      <div className="prose dark:prose-invert max-w-none break-words">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </Card>
  );
}
