
import { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageViewer } from "@/components/secure-message/MessageViewer";
import { Message } from "@/types/message";

interface MessageContentProps {
  message: Message;
  deliveryId: string | null;
  recipientEmail: string | null;
  handleIframeMessage: (event: MessageEvent) => void;
}

export function MessageContent({ 
  message, 
  deliveryId,
  recipientEmail,
  handleIframeMessage
}: MessageContentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto overflow-hidden p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{message.title}</h1>
          <p className="text-sm text-muted-foreground">
            Sent: {new Date(message.created_at).toLocaleString()}
          </p>
        </div>
        
        <div className="prose prose-sm max-w-none">
          {message.content && (
            <div className="whitespace-pre-wrap mb-6">
              {message.content}
            </div>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Attachments</h3>
              <div className="space-y-2">
                {message.attachments.map((attachment, i) => (
                  <div key={i} className="flex items-center p-2 border rounded-md">
                    <span className="flex-1 truncate">{attachment.name}</span>
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={`https://onwthrpgcnfydxzzmyot.supabase.co/storage/v1/object/public/${attachment.path}`} 
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {message.share_location && message.location_latitude && message.location_longitude && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Location</h3>
              <p className="mb-2">{message.location_name || "Location shared"}</p>
              <div className="relative w-full h-48 overflow-hidden rounded-lg border">
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${message.location_longitude},${message.location_latitude})/${message.location_longitude},${message.location_latitude},13,0/500x300?access_token=pk.eyJ1IjoiY3JlYXRvci1pbyIsImEiOiJjbHJrdWl1ZW0wbHRqMmtueXQ5czA0eG40In0.qQBlOYeQgS7-ksJ0ylEnOQ`} 
                  alt="Message location map"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
