
import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Message } from "@/types/message";

interface MessageViewerProps {
  htmlContent: Message | null;
  pinProtected: boolean;
  verifyError: string | null;
  handleIframeMessage: (event: MessageEvent) => void;
}

export function MessageViewer({ 
  htmlContent, 
  pinProtected,
  verifyError,
  handleIframeMessage
}: MessageViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  
  useEffect(() => {
    // Listen for messages from iframe
    window.addEventListener('message', handleIframeMessage);
    
    // Prepare content
    if (htmlContent) {
      // Convert message object to appropriate HTML content
      const messageHtml = `
        <html>
        <head>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 16px; }
            .message-title { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .message-meta { font-size: 14px; color: #666; margin-bottom: 16px; }
            .message-content { white-space: pre-wrap; margin-bottom: 24px; }
          </style>
        </head>
        <body>
          <div class="message-title">${htmlContent.title || 'No Title'}</div>
          <div class="message-meta">Sent: ${new Date(htmlContent.created_at).toLocaleString()}</div>
          <div class="message-content">${htmlContent.content || 'No message content'}</div>
        </body>
        </html>
      `;
      
      setContent(messageHtml);
    }
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [htmlContent, handleIframeMessage]);
  
  return (
    <>
      <Card className="w-full max-w-3xl mx-auto p-0 overflow-hidden">
        {verifyError && (
          <div className="bg-destructive/10 text-destructive p-3 mb-0 text-center">
            {verifyError}
          </div>
        )}
        
        {content ? (
          <iframe 
            srcDoc={content}
            title="Secure Message Content"
            className="w-full border-0 overflow-hidden transition-all duration-300"
            style={{ height: '500px', width: '100%' }}
            sandbox="allow-same-origin"
          />
        ) : (
          <div className="p-6 text-center text-muted-foreground">No content to display</div>
        )}
      </Card>
    </>
  );
}
