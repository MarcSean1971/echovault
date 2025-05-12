
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CreateMessageForm } from "@/components/message/CreateMessageForm";
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export default function CreateMessage() {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);

  // Fetch recipients when the component mounts
  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const data = await fetchRecipients();
        setRecipients(data);
      } catch (error: any) {
        console.error("Failed to load recipients:", error);
        toast({
          title: "Error",
          description: "Failed to load recipients. " + error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    loadRecipients();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/messages")}
        className={`mb-6 hover:bg-muted/80 hover:text-foreground ${HOVER_TRANSITION}`}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Messages
      </Button>
      
      <div className="max-w-3xl mx-auto">
        <CreateMessageForm onCancel={() => navigate("/messages")} />
      </div>
    </div>
  );
}
