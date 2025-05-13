
import { toast } from "@/components/ui/use-toast";
import { fetchRecipients } from "@/services/messages/recipientService";

export function useRecipientHandler() {
  const fetchSelectedRecipients = async (selectedRecipientIds: string[]) => {
    if (selectedRecipientIds.length === 0) {
      throw new Error("Please select at least one recipient.");
    }
    
    const allRecipients = await fetchRecipients();
    const selectedRecipientObjects = allRecipients.filter(recipient => 
      selectedRecipientIds.includes(recipient.id)
    );
    
    if (selectedRecipientObjects.length === 0) {
      throw new Error("No valid recipients found. Please check your recipient selection.");
    }
    
    return selectedRecipientObjects;
  };

  return {
    fetchSelectedRecipients
  };
}
