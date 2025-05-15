
import React from 'react';
import { MessageRecipientsList } from "@/components/message/detail/MessageRecipientsList";
import { Recipient } from "@/types/message";

interface MessageRecipientProviderProps {
  recipients: Recipient[];
}

export function MessageRecipientProvider({ recipients }: MessageRecipientProviderProps) {
  // Change the function signature to match what's expected
  const renderRecipients = () => {
    return <MessageRecipientsList recipients={recipients} />;
  };

  return { renderRecipients };
}
