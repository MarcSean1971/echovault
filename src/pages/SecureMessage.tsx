
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";

export default function SecureMessage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("id");
  const recipient = searchParams.get("recipient");
  const deliveryId = searchParams.get("delivery");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [pinProtected, setPinProtected] = useState(false);
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const fetchMessage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured");
      }
      
      // Make sure the URL doesn't have a trailing slash
      const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
      const apiUrl = `${baseUrl}/functions/v1/access-message?id=${messageId}&recipient=${encodeURIComponent(recipient || "")}&delivery=${deliveryId || ""}`;
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "text/html,application/xhtml+xml"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load message: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Check if the response contains PIN form
      if (html.includes("pin-form")) {
        setPinProtected(true);
        setHtmlContent(html);
      } else {
        setHtmlContent(html);
      }
    } catch (err: any) {
      console.error("Error fetching message:", err);
      setError(err.message || "Failed to load the secure message");
    } finally {
      setLoading(false);
    }
  };
  
  // Update iframe content when HTML content changes
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
        
        // Add message listener for communication from iframe
        window.addEventListener('message', handleIframeMessage);
        
        // Add script to handle form submission inside iframe
        if (pinProtected) {
          addPinFormHandler(iframeDoc);
        }
      }
    }
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [htmlContent, pinProtected]);
  
  // Handle messages from iframe
  const handleIframeMessage = (event: MessageEvent) => {
    // Process messages from the iframe if needed
    if (event.data.type === 'PIN_SUBMIT') {
      verifyPin(event.data.pin);
    }
  };
  
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
  
  // Verify PIN and reload message if correct
  const verifyPin = async (pinValue: string) => {
    if (!pinValue.trim()) {
      setVerifyError("Please enter a PIN");
      return;
    }
    
    setVerifying(true);
    setVerifyError(null);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("Supabase URL not configured");
      }
      
      // Make sure the URL doesn't have a trailing slash
      const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
      const apiUrl = `${baseUrl}/functions/v1/access-message/verify-pin`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          pin: pinValue, 
          messageId, 
          deliveryId,
          recipientEmail: recipient
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        // Show error in parent window
        setVerifyError(data.error || "Incorrect PIN");
        
        // Also update error in iframe
        if (iframeRef.current) {
          const iframeDoc = iframeRef.current.contentDocument || 
                          (iframeRef.current.contentWindow?.document);
          const errorElement = iframeDoc?.getElementById('pin-error');
          if (errorElement) {
            errorElement.textContent = data.error || "Incorrect PIN";
            errorElement.style.display = 'block';
          }
        }
        return;
      }
      
      // PIN verified, fetch the message again
      setPinProtected(false);
      await fetchMessage();
      toast({
        title: "PIN Verified",
        description: "Message unlocked successfully",
      });
    } catch (err: any) {
      console.error("Error verifying PIN:", err);
      setVerifyError(err.message || "Error verifying PIN");
    } finally {
      setVerifying(false);
    }
  };
  
  useEffect(() => {
    if (messageId && (recipient || deliveryId)) {
      fetchMessage();
    } else {
      setError("Invalid message link. Missing required parameters.");
      setLoading(false);
    }
  }, [messageId, recipient, deliveryId]);
  
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
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.onload = setIframeHeight;
    }
    
    window.addEventListener('resize', setIframeHeight);
    return () => {
      window.removeEventListener('resize', setIframeHeight);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-lg p-8 text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg font-medium">Loading secure message...</p>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="w-full max-w-lg p-8 mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="mb-6">{error}</p>
            <Button variant="secondary" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Render iframe with message content
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto p-6 overflow-hidden">
        {verifyError && (
          <div className="bg-destructive/10 text-destructive p-3 mb-4 rounded-md text-center">
            {verifyError}
          </div>
        )}
        
        <iframe 
          ref={iframeRef}
          title="Secure Message Content"
          className="w-full border-0 overflow-hidden"
          style={{ minHeight: '400px', width: '100%' }}
          sandbox="allow-same-origin allow-scripts"
        />
      </Card>
      
      <div className="w-full max-w-3xl mx-auto mt-6 text-center">
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  );
}
