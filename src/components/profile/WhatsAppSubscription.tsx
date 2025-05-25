
import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWhatsAppSubscription } from "@/hooks/useWhatsAppSubscription";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function WhatsAppSubscription() {
  const { subscribeToWhatsApp, isLoading } = useWhatsAppSubscription();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={subscribeToWhatsApp}
            disabled={isLoading}
            className={`bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:text-green-800 ${HOVER_TRANSITION}`}
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {isLoading ? "Sending..." : "Share Contact for Notifications"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            Share your contact information to receive SOS alerts and check-in reminders via WhatsApp
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
