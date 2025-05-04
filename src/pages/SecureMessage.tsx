
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export default function SecureMessage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get("id");
  const recipientEmail = searchParams.get("recipient");
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinProtected, setPinProtected] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Fetch the message data directly from Supabase
  useEffect(() => {
    async function fetchMessage() {
      setLoading(true);
      setError(null);
      
      try {
        if (!messageId) {
          throw new Error("No message ID provided");
        }
        
        // First get the message
        const { data: message, error: messageError } = await supabase
          .from("messages")
          .select("*")
          .eq("id", messageId)
          .single();
          
        if (messageError) {
          throw new Error("Message not found");
        }
        
        // Next, check if this message has security conditions
        const { data: condition, error: conditionError } = await supabase
          .from("message_conditions")
          .select("*")
          .eq("message_id", messageId)
          .single();
          
        if (conditionError) {
          console.error("Error fetching condition:", conditionError);
          // Continue without condition info
        } else {
          // Check if pin protected
          if (condition.pin_code) {
            setPinProtected(true);
          }
          
          // Check if recipient is authorized
          if (recipientEmail && condition.recipients) {
            const isAuthorized = condition.recipients.some((r: any) => 
              r.email && r.email.toLowerCase() === recipientEmail.toLowerCase()
            );
            
            if (!isAuthorized) {
              throw new Error("You are not authorized to view this message");
            }
          }
        }
        
        setMessage(message);
      } catch (err: any) {
        console.error("Error fetching message:", err);
        setError(err.message || "Failed to load the message");
      } finally {
        setLoading(false);
      }
    }
    
    fetchMessage();
  }, [messageId, recipientEmail]);
  
  // Handle PIN verification
  const verifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setPinError("Please enter a PIN");
      return;
    }
    
    setVerifyingPin(true);
    setPinError(null);
    
    try {
      // Get the message condition to compare PIN
      const { data: condition, error } = await supabase
        .from("message_conditions")
        .select("pin_code")
        .eq("message_id", messageId)
        .single();
      
      if (error) {
        throw new Error("Error verifying PIN");
      }
      
      // Compare PINs
      if (condition.pin_code === pin) {
        // PIN matches, show the message
        setPinProtected(false);
        
        // Record the view
        await supabase
          .from("delivered_messages")
          .update({ viewed_count: 1 })
          .eq("message_id", messageId)
          .eq("recipient_id", recipientEmail);
      } else {
        setPinError("Incorrect PIN");
      }
    } catch (err: any) {
      console.error("Error verifying PIN:", err);
      setPinError(err.message || "Error verifying PIN");
    } finally {
      setVerifyingPin(false);
    }
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="w-full max-w-lg p-8 mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
            <p className="mb-6">{error}</p>
            
            <Button 
              variant="secondary" 
              onClick={() => window.history.back()}
              className={`hover:bg-secondary/90 ${HOVER_TRANSITION}`}
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // PIN protected message
  if (pinProtected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="w-full max-w-lg p-8 mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Secure Message</h1>
          <p className="mb-4 text-center">This message is protected with a PIN.</p>
          
          <form onSubmit={verifyPin}>
            {pinError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{pinError}</AlertDescription>
              </Alert>
            )}
            
            <div className="mb-4">
              <Input 
                type="text" 
                placeholder="Enter PIN" 
                value={pin} 
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-xl letter-spacing-wide"
                maxLength={6}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={verifyingPin}
            >
              {verifyingPin ? <Spinner size="sm" className="mr-2" /> : null}
              Verify PIN
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Display the message
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto p-6 overflow-hidden">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold mb-1">{message.title}</h1>
        </div>
        
        {message.message_type === "text" ? (
          <div className="prose max-w-none">
            {message.content}
          </div>
        ) : message.message_type === "audio" ? (
          <div className="space-y-4">
            <p className="text-lg">This message contains audio content.</p>
            <audio controls className="w-full">
              <source src={JSON.parse(message.content).audioUrl} type="audio/mp4" />
              Your browser does not support the audio element.
            </audio>
            
            {JSON.parse(message.content).transcription && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="font-semibold mb-2">Transcription:</p>
                <p>{JSON.parse(message.content).transcription}</p>
              </div>
            )}
          </div>
        ) : message.message_type === "video" ? (
          <div className="space-y-4">
            <p className="text-lg">This message contains video content.</p>
            <video controls className="w-full rounded-md">
              <source src={JSON.parse(message.content).videoUrl} type="video/mp4" />
              Your browser does not support the video element.
            </video>
            
            {JSON.parse(message.content).transcription && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="font-semibold mb-2">Transcription:</p>
                <p>{JSON.parse(message.content).transcription}</p>
              </div>
            )}
          </div>
        ) : (
          <p>Unsupported message type.</p>
        )}
        
        {message.share_location && message.location_latitude && message.location_longitude && (
          <div className="mt-6 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-md">
            <h3 className="text-lg font-medium mb-2">📍 Location Shared</h3>
            <p className="mb-2">{message.location_name || "Unnamed location"}</p>
            <a 
              href={`https://maps.google.com/?q=${message.location_latitude},${message.location_longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              View on Google Maps
            </a>
          </div>
        )}
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Attachments</h3>
            <ul className="space-y-2">
              {message.attachments.map((attachment: any, index: number) => (
                <li key={index} className="p-2 bg-muted rounded-md flex items-center">
                  <span className="flex-1 truncate">{attachment.name}</span>
                  <a 
                    href={attachment.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      
      <div className="w-full max-w-3xl mx-auto mt-6 text-center">
        <Button 
          variant="secondary" 
          onClick={() => window.history.back()}
          className={`hover:bg-secondary/90 transition-colors ${HOVER_TRANSITION}`}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
