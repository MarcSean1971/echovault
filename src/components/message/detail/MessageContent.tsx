
import { Message } from "@/types/message";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { MessageTypeIcon } from "./MessageTypeIcon";

interface MessageContentProps {
  message: Message;
  isArmed: boolean;
}

export function MessageContent({ message, isArmed }: MessageContentProps) {
  return (
    <TabsContent value="content" className="space-y-4 pt-2">
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
