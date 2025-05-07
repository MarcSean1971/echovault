
import React from "react";
import { Message } from "@/types/message";

interface UnknownMessageContentProps {
  message: Message;
}

export function UnknownMessageContent({ message }: UnknownMessageContentProps) {
  return (
    <div className="text-center py-12 border rounded-md">
      <p className="text-muted-foreground mb-4">
        Unknown message type
      </p>
      <p className="text-sm">
        This message type is not supported yet
      </p>
    </div>
  );
}
