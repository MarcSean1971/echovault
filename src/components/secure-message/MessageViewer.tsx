
import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface MessageViewerProps {
  htmlContent: string | null;
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Add message listener for communication from iframe
  useEffect(() => {
    if (htmlContent && iframeRef.current) {
      // Get the iframe document
      const iframeDoc = iframeRef.current.contentDocument || 
                      (iframeRef.current.contentWindow?.document);
      
      if (iframeDoc) {
        // Write the HTML content to the iframe
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        
        window.addEventListener('message', handleIframeMessage);
        
        // Add script to handle form submission inside iframe
        if (pinProtected) {
          addPinFormHandler(iframeDoc);
        }
      }
    }
    
    // Set iframe height based on content
    const setIframeHeight = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          const height = iframeRef.current.contentWindow.document.body.scrollHeight;
          iframeRef.current.style.height = `${height + 20}px`;
        } catch (e) {
          // Handle cross-origin errors
          iframeRef.current.style.height = '500px';
        }
      }
    };
    
    // Resize iframe after content loads
    if (iframeRef.current) {
      iframeRef.current.onload = setIframeHeight;
    }
    
    window.addEventListener('resize', setIframeHeight);
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
      window.removeEventListener('resize', setIframeHeight);
    };
  }, [htmlContent, pinProtected, handleIframeMessage]);
  
  // Add handler for PIN form inside iframe
  const addPinFormHandler = (iframeDoc: Document) => {
    const pinForm = iframeDoc.getElementById('pin-form');
    
    if (pinForm) {
      const script = iframeDoc.createElement('script');
      script.innerHTML = `
        document.getElementById('pin-form').addEventListener('submit', function(e) {
          e.preventDefault();
          const pin = document.getElementById('pin-input').value;
          
          // Send message to parent window
          window.parent.postMessage({
            type: 'PIN_SUBMIT',
            pin: pin
          }, '*');
        });
      `;
      iframeDoc.body.appendChild(script);
    }
  };
  
  return (
    <>
      <Card className="w-full max-w-3xl mx-auto p-6 overflow-hidden">
        {verifyError && (
          <div className="bg-destructive/10 text-destructive p-3 mb-4 rounded-md text-center">
            {verifyError}
          </div>
        )}
        
        <iframe 
          ref={iframeRef}
          title="Secure Message Content"
          className="w-full border-0 overflow-hidden transition-all duration-300"
          style={{ minHeight: '400px', width: '100%' }}
          sandbox="allow-same-origin allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-forms"
        />
      </Card>
    </>
  );
}
