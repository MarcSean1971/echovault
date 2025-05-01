
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { MessageSquare, File, Video, Trash2, Edit, ArrowRight, Paperclip } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Message } from "@/types/message";

interface MessageCardProps {
  message: Message;
  onDelete: (id: string) => void;
}

export const getMessageIcon = (type: string) => {
  switch (type) {
    case 'text':
      return <MessageSquare className="h-5 w-5" />;
    case 'voice':
      return <File className="h-5 w-5" />;
    case 'video':
      return <Video className="h-5 w-5" />;
    default:
      return <MessageSquare className="h-5 w-5" />;
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export function MessageCard({ message, onDelete }: MessageCardProps) {
  const navigate = useNavigate();
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <Card key={message.id} className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getMessageIcon(message.message_type)}
            <CardTitle className="text-lg">{message.title}</CardTitle>
          </div>
        </div>
        <CardDescription className="pt-2">
          {formatDate(message.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message.message_type === 'text' ? (
          <p className="line-clamp-3">
            {message.content || "No content"}
          </p>
        ) : (
          <p className="text-muted-foreground italic">
            {message.message_type === 'voice' ? 'Voice message' : 'Video message'}
          </p>
        )}
        
        {hasAttachments && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4 mr-1" />
              <span>{message.attachments!.length} attachment{message.attachments!.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/message/${message.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(message.id)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/message/${message.id}`)}
        >
          View <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
