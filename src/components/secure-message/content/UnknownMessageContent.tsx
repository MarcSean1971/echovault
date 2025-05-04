
import React from "react";

export function UnknownMessageContent() {
  return (
    <div className="text-center py-8 border rounded-md">
      <p className="text-muted-foreground mb-2">
        Unknown message type
      </p>
      <p className="text-sm">
        This message type is not supported in the secure message viewer
      </p>
    </div>
  );
}
