
import { Button } from "@/components/ui/button";
import { useMessageForm } from "../MessageFormContext";
import { FileText } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function MessageTypeTabSelector() {
  const { messageType, setMessageType } = useMessageForm();

  const handleTypeClick = () => {
    setMessageType("text");
  };

  return (
    <div className="flex space-x-2 mb-4 border-b">
      <Button
        type="button"
        variant={messageType === "text" ? "default" : "ghost"}
        className={`rounded-none rounded-t-lg ${HOVER_TRANSITION} ${
          messageType === "text" ? "" : "hover:text-primary"
        }`}
        onClick={handleTypeClick}
      >
        <FileText className="h-4 w-4 mr-2" />
        Text
      </Button>
    </div>
  );
}
