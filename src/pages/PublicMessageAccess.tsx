
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";
import { AlertCircle, Shield, Check, Key, Clock } from "lucide-react";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageAttachments } from "@/components/message/detail/MessageAttachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export default function PublicMessageAccess() {
  const { id: messageId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const deliveryId = searchParams.get('delivery');
  const recipientEmail = searchParams.get('recipient');
  
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState<string>('');
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [isUnlockDelayed, setIsUnlockDelayed] = useState(false);
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  
  // Verify access and load message
  useEffect(() => {
    const verifyAccess = async () => {
      if (!messageId || !deliveryId || !recipientEmail) {
        setError('Invalid access link. Please check your email for the correct link.');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // First, verify the delivery record
        const { data: deliveryData, error: deliveryError } = await supabase
          .from('delivered_messages')
          .select(`
            id, 
            message_id, 
            recipient_id, 
            delivery_id,
            viewed_at,
            viewed_count,
            condition_id
          `)
          .eq('delivery_id', deliveryId)
          .eq('message_id', messageId)
          .single();
        
        if (deliveryError || !deliveryData) {
          console.error('Error verifying delivery:', deliveryError);
          setError('This message link is invalid or has expired.');
          setIsLoading(false);
          return;
        }
        
        // Verify the recipient email
        const { data: recipientData, error: recipientError } = await supabase
          .from('recipients')
          .select('id, email')
          .eq('id', deliveryData.recipient_id)
          .single();
          
        if (recipientError || !recipientData || recipientData.email !== recipientEmail) {
          console.error('Error verifying recipient:', recipientError);
          setError('Unauthorized access. This message is intended for a different recipient.');
          setIsLoading(false);
          return;
        }
        
        // Check if there are any security constraints
        const { data: conditionData, error: conditionError } = await supabase
          .from('message_conditions')
          .select('pin_code, unlock_delay_hours')
          .eq('id', deliveryData.condition_id)
          .single();
        
        if (conditionError) {
          console.error('Error fetching message conditions:', conditionError);
          // Continue despite error - just means we can't enforce security constraints
        }
        
        // Check if PIN is required
        if (conditionData?.pin_code) {
          setIsPinRequired(true);
        } else {
          setIsVerified(true);
        }
        
        // Check if unlock delay is required
        if (conditionData?.unlock_delay_hours && conditionData.unlock_delay_hours > 0) {
          // Calculate unlock time based on delivery record
          const deliveredAt = new Date(deliveryData.delivered_at || new Date());
          const unlockDelayMs = conditionData.unlock_delay_hours * 60 * 60 * 1000;
          const calculatedUnlockTime = new Date(deliveredAt.getTime() + unlockDelayMs);
          
          if (calculatedUnlockTime > new Date()) {
            setIsUnlockDelayed(true);
            setUnlockTime(calculatedUnlockTime);
          }
        }
        
        // Fetch the message content if no security constraints or if already viewed before
        if ((deliveryData.viewed_count && deliveryData.viewed_count > 0) || 
            (!isPinRequired && !isUnlockDelayed)) {
          await loadMessage();
        }
        
        // Update view count if this is a valid access
        if (!deliveryData.viewed_at) {
          await supabase
            .from('delivered_messages')
            .update({
              viewed_at: new Date().toISOString(),
              viewed_count: (deliveryData.viewed_count || 0) + 1
            })
            .eq('delivery_id', deliveryId);
        } else {
          // Increment view count
          await supabase
            .from('delivered_messages')
            .update({
              viewed_count: (deliveryData.viewed_count || 0) + 1
            })
            .eq('delivery_id', deliveryId);
        }
      } catch (err: any) {
        console.error('Error verifying access:', err);
        setError('An error occurred while verifying access to this message.');
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAccess();
  }, [messageId, deliveryId, recipientEmail]);
  
  // Load message content
  const loadMessage = async () => {
    if (!messageId) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();
        
      if (error) throw error;
      setMessage(data as Message);
    } catch (err: any) {
      console.error('Error loading message:', err);
      setError('Unable to load message content.');
    }
  };
  
  // Handle PIN submission
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageId || !deliveryId) return;
    
    setIsSubmittingPin(true);
    
    try {
      // Verify PIN against the database
      const { data, error } = await supabase
        .from('message_conditions')
        .select('id, pin_code')
        .eq('message_id', messageId)
        .single();
      
      if (error) throw error;
      
      if (data.pin_code === pinCode) {
        setIsVerified(true);
        await loadMessage();
      } else {
        toast({
          title: "Invalid PIN code",
          description: "The PIN code you entered is incorrect.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error verifying PIN:', err);
      toast({
        title: "Error",
        description: "Failed to verify PIN code.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingPin(false);
    }
  };
  
  // Format remaining time for delayed unlock
  const formatRemainingTime = () => {
    if (!unlockTime) return '';
    
    const now = new Date();
    const diffMs = unlockTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      setIsUnlockDelayed(false);
      loadMessage();
      return '';
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Update countdown timer
  useEffect(() => {
    if (!isUnlockDelayed || !unlockTime) return;
    
    const intervalId = setInterval(() => {
      const remainingTime = formatRemainingTime();
      if (!remainingTime) clearInterval(intervalId);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isUnlockDelayed, unlockTime]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6 border-red-200">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold">Access Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-4">
              If you believe this is a mistake, please contact the sender of this message.
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  // Render PIN entry form
  if (isPinRequired && !isVerified) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <Key className="h-12 w-12 text-blue-500" />
            <h2 className="text-xl font-semibold">Secure Message</h2>
            <p className="text-muted-foreground">This message is protected with a PIN code.</p>
            
            <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-4 mt-4">
              <Input
                type="text"
                placeholder="Enter PIN code"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="text-center text-lg"
                autoFocus
              />
              <Button 
                type="submit" 
                className={`w-full ${HOVER_TRANSITION}`} 
                disabled={!pinCode || isSubmittingPin}
              >
                {isSubmittingPin ? "Verifying..." : "Access Message"}
              </Button>
            </form>
            
            <p className="text-sm text-muted-foreground mt-4">
              If you don't know the PIN code, please contact the sender.
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  // Render delayed unlock message
  if (isUnlockDelayed && unlockTime) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <Clock className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-semibold">Message Unlock Delayed</h2>
            <p className="text-muted-foreground">
              This message has a time-delayed unlock. It will be available in:
            </p>
            
            <div className="text-2xl font-mono font-semibold mt-2">
              {formatRemainingTime()}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Please check back later or keep this page open to access the message when the timer expires.
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  // Render message content
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6">
        {message ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">{message.title}</h2>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-md p-3 flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700">Secure message access verified</p>
            </div>
            
            <Separator />
            
            <MessageContent message={message} isArmed={false} />
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-2">Attachments</h3>
                <MessageAttachments message={message} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-semibold">Message Not Available</h2>
            <p className="text-muted-foreground">
              There was a problem loading the message content. Please try again later.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
