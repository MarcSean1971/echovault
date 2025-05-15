
import React from 'react';
import { MessageRecipientsList } from "@/components/message/detail/MessageRecipientsList";
import { Recipient } from "@/types/message";

interface MessageRecipientProviderProps {
  recipients: Recipient[];
}

export function MessageRecipientProvider({ recipients }: MessageRecipientProviderProps) {
  // Function with no parameters that returns a React node
  const renderRecipients = () => {
    return <MessageRecipientsList recipients={recipients} />;
  };

  return { renderRecipients };
}
