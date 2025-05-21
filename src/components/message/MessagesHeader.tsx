
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";

export function MessagesHeader() {
  const navigate = useNavigate();
  
  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex flex-row items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
            Your Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Secure communications that transcend time and circumstances
          </p>
        </div>
        
        <Button 
          onClick={() => navigate("/create-message")}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} gap-2 shadow-sm hover:shadow-md`}
          size="lg"
        >
          <PlusCircle className={`h-5 w-5 ${HOVER_TRANSITION}`} />
          Create New Message
        </Button>
      </div>
    </div>
  );
}
