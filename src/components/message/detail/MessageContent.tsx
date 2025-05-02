
import { Message } from "@/types/message";
import { Info, MessageSquare, Video, File } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";

interface MessageContentProps {
  message: Message;
  isArmed: boolean;
}

export function MessageContent({ message, isArmed }: MessageContentProps) {
  const getMessageTypeIcon = () => {
    if (!message) return null;
    
    switch (message.message_type) {
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

  return (
    <TabsContent value="content" className="space-y-4 pt-2">
      {isArmed && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-md dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800 text-sm">
          <p className="flex items-center">
            <Info className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span>This message is armed and will be delivered according to your settings. Disarm it to make changes.</span>
          </p>
        </div>
      )}
      
      {message.message_type === 'text' ? (
        <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm md:text-base">
          {message.content || <span className="text-muted-foreground italic">No content</span>}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground mb-4">
            {message.message_type === 'voice' 
              ? 'Voice message playback'
              : 'Video message playback'}
          </p>
          <p className="text-sm">
            This feature is coming soon!
          </p>
        </div>
      )}
    </TabsContent>
  );
}
