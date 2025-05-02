
import React from "react";

export function UnknownMessageContent() {
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
