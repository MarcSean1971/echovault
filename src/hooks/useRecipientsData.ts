
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { fetchRecipients } from "@/services/messages/recipientService";
import { Recipient } from "@/types/message";

export function useRecipientsData() {
  const { userId, isSignedIn } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Update authentication status when auth state changes
  useEffect(() => {
    if (isSignedIn) {
      console.log("User is signed in, userId:", userId);
    } else {
      console.log("User is not signed in");
    }
  }, [isSignedIn, userId]);

  // Fetch recipients on component mount
  useEffect(() => {
    if (!userId) return;
    
    const loadRecipients = async () => {
      setIsInitialLoading(true);
      try {
        const data = await fetchRecipients();
        setRecipients(data);
      } catch (error: any) {
        console.error("Failed to load recipients:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load your recipients",
          variant: "destructive"
        });
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadRecipients();
  }, [userId]);

  return {
    recipients,
    setRecipients,
    isInitialLoading
  };
}
