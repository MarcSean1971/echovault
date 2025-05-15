
import React from 'react';
import { MessageRecipientsList } from "@/components/message/detail/MessageRecipientsList";
import { Recipient } from "@/types/message";

interface MessageRecipientProviderProps {
  recipients: Recipient[];
}

export function MessageRecipientProvider({ recipients }: MessageRecipientProviderProps) {
  // Change the function to return a no-argument function that returns ReactNode
  const renderRecipients = () => {
    return <MessageRecipientsList recipients={recipients} />;
  };

  return { renderRecipients };
}
