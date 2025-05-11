
import { useState, useEffect } from "react";
import { Recipient } from "@/types/message";
import { fetchRecipients } from "@/services/messages/recipientService";
import { useMessageForm } from "@/components/message/MessageFormContext";

export function useRecipientSelection() {
  const { selectedRecipients, setSelectedRecipients } = useMessageForm();
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // Load recipients
  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const allRecipients = await fetchRecipients();
        setRecipients(allRecipients);
      } catch (error) {
        console.error("Error loading recipients:", error);
      }
    };
    
    loadRecipients();
  }, []);

  // Toggle function for recipients
  const handleToggleRecipient = (recipientId: string) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId));
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  return {
    recipients,
    selectedRecipients,
    handleToggleRecipient
  };
}
