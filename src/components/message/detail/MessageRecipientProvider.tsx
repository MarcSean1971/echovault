
import React from 'react';
import { MessageRecipientsList } from "@/components/message/detail/MessageRecipientsList";

interface MessageRecipientProviderProps {
  recipients: any[];
}

export function MessageRecipientProvider({ recipients }: MessageRecipientProviderProps) {
  // Custom function to render recipients list with React components
  const renderRecipients = () => {
    return <MessageRecipientsList recipients={recipients} />;
  };

  return { renderRecipients };
}
