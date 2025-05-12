
import { Message } from "@/types/message";
import { MessageCard } from "./MessageCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2, PlusCircle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageGridProps {
  messages: Message[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function MessageGrid({ messages, isLoading, onDelete }: MessageGridProps) {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className={`h-12 w-12 text-muted-foreground animate-spin mb-4 ${HOVER_TRANSITION}`} />
        <p className="text-muted-foreground">Loading your messages...</p>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <Card className="text-center py-16 bg-gradient-to-b from-muted/30 to-background">
        <CardContent className="flex flex-col items-center">
          <div className="mb-6 p-6 rounded-full bg-primary/5 text-primary">
            <FileText className={`h-12 w-12 ${HOVER_TRANSITION}`} />
          </div>
          <h3 className="text-xl font-medium mb-2">No messages yet</h3>
          <p className="mb-6 text-muted-foreground">Create your first message to get started</p>
          <Button 
            onClick={() => navigate("/create-message")}
            className={`${HOVER_TRANSITION} gap-2`}
            size="lg"
          >
            <PlusCircle className="h-5 w-5" />
            Create Your First Message
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <MessageCard 
            message={message} 
            onDelete={onDelete} 
          />
        </div>
      ))}
    </div>
  );
}
