
import { Message } from "@/types/message";
import { MessageCard } from "./MessageCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MessageGridProps {
  messages: Message[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function MessageGrid({ messages, isLoading, onDelete }: MessageGridProps) {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading your messages...</p>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="mb-4 text-muted-foreground">You don't have any messages yet</p>
          <Button onClick={() => navigate("/create-message")}>Create Your First Message</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {messages.map((message) => (
        <MessageCard 
          key={message.id} 
          message={message} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
