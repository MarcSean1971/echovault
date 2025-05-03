
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/use-toast";

export default function SecureMessage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("id");
  const recipient = searchParams.get("recipient");
  const deliveryId = searchParams.get("delivery");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [pinProtected, setPinProtected] = useState(false);
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  
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
      } else {
        setContent(html);
      }
    } catch (err: any) {
      console.error("Error fetching message:", err);
      setError(err.message || "Failed to load the secure message");
    } finally {
      setLoading(false);
    }
  };
  
  const verifyPin = async () => {
    if (!pin.trim()) {
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
          pin, 
          messageId, 
          deliveryId,
          recipientEmail: recipient
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setVerifyError(data.error || "Incorrect PIN");
        return;
      }
      
      // PIN verified, fetch the message again
      await fetchMessage();
      setPinProtected(false);
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
  
  if (pinProtected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="w-full max-w-lg p-8 mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">PIN Protected Message</h1>
            <p className="mb-6">This message requires a PIN to access. Please enter the PIN provided by the sender.</p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={6}
              />
              
              {verifyError && (
                <p className="text-destructive">{verifyError}</p>
              )}
              
              <Button onClick={verifyPin} disabled={verifying} className="w-full">
                {verifying ? <Spinner size="sm" className="mr-2" /> : null}
                Access Message
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-3xl mx-auto p-6">
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
          </div>
        </Card>
        
        <div className="w-full max-w-3xl mx-auto mt-6 text-center">
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return null;
}

// Simple function to sanitize HTML content
function sanitizeHtml(html: string): string {
  // Extract only the body content from the full HTML
  const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyContentMatch ? bodyContentMatch[1] : html;
  
  // Filter out any script tags for security
  return bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
