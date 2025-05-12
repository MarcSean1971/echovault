
import React from "react";
import { MessageContent as RefactoredMessageContent } from "./content/message-content";
import { MessageContentProps } from "./content/message-content/MessageContent";

export { MessageContentProps };

export function MessageContent(props: MessageContentProps) {
  return <RefactoredMessageContent {...props} />;
}
