
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { MessageFilter } from "@/components/message/MessageFilter";

interface MessagesHeaderProps {
  messageType: string | null;
  onFilterChange: (type: string | null) => void;
}

export function MessagesHeader({ messageType, onFilterChange }: MessagesHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <>
      <div className="flex flex-col mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Your Messages
        </h1>
        <p className="text-muted-foreground mt-1">
          Secure communications that transcend time and circumstances
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <MessageFilter 
          messageType={messageType} 
          onFilterChange={onFilterChange} 
        />
        <Button 
          onClick={() => navigate("/create-message")}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default} gap-2 shadow-sm hover:shadow-md`}
          size="lg"
        >
          <PlusCircle className={`h-5 w-5 ${HOVER_TRANSITION}`} />
          Create New Message
        </Button>
      </div>
    </>
  );
}
