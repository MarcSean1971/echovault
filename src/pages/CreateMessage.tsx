
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CreateMessageForm } from "@/components/message/CreateMessageForm";
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";
import { toast } from "@/components/ui/use-toast";

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Message</h1>
      </div>

      <CreateMessageForm onCancel={() => navigate("/dashboard")} />
    </div>
  );
}
