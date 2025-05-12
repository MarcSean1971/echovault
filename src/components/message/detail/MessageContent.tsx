
import React from "react";
import { MessageContent as RefactoredMessageContent } from "./content/message-content";
import type { MessageContentProps } from "./content/message-content";

export type { MessageContentProps };

export function MessageContent(props: MessageContentProps) {
  return <RefactoredMessageContent {...props} />;
}
