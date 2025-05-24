
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function CreateMessageButton() {
  const navigate = useNavigate();

  return (
    <Button 
      onClick={() => navigate("/create-message")}
      className={`${HOVER_TRANSITION}`}
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Message
    </Button>
  );
}
