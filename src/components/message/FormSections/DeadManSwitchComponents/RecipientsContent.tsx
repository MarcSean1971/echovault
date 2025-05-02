
import { Recipient } from "@/types/message";
import { RecipientSelector } from "../RecipientSelector";

interface RecipientsContentProps {
  recipients: Recipient[];
  selectedRecipients: string[];
  onSelectRecipient: (recipientId: string) => void;
  isLoading: boolean;
  setActiveTab: (tab: string) => void;
}

export function RecipientsContent({
  recipients,
  selectedRecipients,
  onSelectRecipient,
  isLoading,
  setActiveTab
}: RecipientsContentProps) {
  return (
    <div className="space-y-6">
      <RecipientSelector
        selectedRecipients={selectedRecipients}
        onSelectRecipient={onSelectRecipient}
      />
      
      <div className="pt-4 flex justify-between">
        <button 
          type="button"
          onClick={() => setActiveTab("delivery")}
          className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
        >
          Back to Delivery Method
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab("security")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Next: Security Options
        </button>
      </div>
    </div>
  );
}
