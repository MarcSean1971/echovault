import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Message } from '@/types/message';
import { MessageDisplay } from '@/components/message/public-access/MessageDisplay';
import { LoadingState } from '@/components/message/public-access/LoadingState';

export default function DiagnosticAccess() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [messageId, setMessageId] = useState(id || '');
  const [deliveryId, setDeliveryId] = useState(searchParams.get('delivery') || '');
  const [recipientEmail, setRecipientEmail] = useState(searchParams.get('recipient') || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (text: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${text}`]);
  };
  
  useEffect(() => {
    if (id) {
      setMessageId(id);
      addLog(`Message ID set from URL: ${id}`);
    }
    
    const deliveryParam = searchParams.get('delivery');
    if (deliveryParam) {
      setDeliveryId(deliveryParam);
      addLog(`Delivery ID set from URL: ${deliveryParam}`);
    }
    
    const recipientParam = searchParams.get('recipient');
    if (recipientParam) {
      setRecipientEmail(recipientParam);
      addLog(`Recipient email set from URL: ${recipientParam}`);
    }
  }, [id, searchParams]);
  
  const checkDelivery = async () => {
    if (!messageId || !deliveryId) {
      toast({
        title: "Missing Parameters",
        description: "Please provide both Message ID and Delivery ID",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    addLog(`Checking delivery record: message=${messageId}, delivery=${deliveryId}`);
    
    try {
      const { data, error } = await supabase
        .from('delivered_messages')
        .select('*')
        .eq('message_id', messageId)
        .eq('delivery_id', deliveryId);
        
      if (error) {
        addLog(`Error: ${error.message}`);
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive"
        });
      } else if (!data || data.length === 0) {
        addLog('No delivery record found');
        toast({
          title: "Not Found",
          description: "No delivery record matching these parameters",
          variant: "destructive"
        });
      } else {
        addLog(`Success! Found delivery record: ${JSON.stringify(data[0])}`);
        toast({
          title: "Delivery Found",
          description: "A matching delivery record exists in the database"
        });
      }
    } catch (e) {
      addLog(`Exception: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMessageDirect = async () => {
    if (!messageId) {
      toast({
        title: "Missing Message ID",
        description: "Please provide a Message ID",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    addLog(`Direct message load attempt for: ${messageId}`);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .maybeSingle();
        
      if (error) {
        setError(error.message);
        addLog(`Error: ${error.message}`);
      } else if (!data) {
        setError("Message not found");
        addLog('Message not found');
      } else {
        // Transform the raw data to match the Message type format with all required properties
        const transformedMessage: Message = {
          ...data,
          attachments: Array.isArray(data.attachments) 
            ? data.attachments.map((att: any) => ({
                path: att.path || '',
                name: att.name || '',
                size: att.size || 0,
                type: att.type || '',
              }))
            : null,
          // Add the required properties that might be missing from the database
          // Use type assertion to tell TypeScript that data might have these properties
          expires_at: (data as any).expires_at || null,
          sender_name: (data as any).sender_name || null
        };
        setMessage(transformedMessage);
        addLog(`Success! Loaded message: "${data.title}"`);
      }
    } catch (e) {
      setError((e as Error).message);
      addLog(`Exception: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMessageSecure = async () => {
    if (!messageId || !deliveryId || !recipientEmail) {
      toast({
        title: "Missing Parameters",
        description: "Please provide Message ID, Delivery ID and Recipient Email",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    addLog(`Secure message load attempt: message=${messageId}, delivery=${deliveryId}, recipient=${recipientEmail}`);
    
    try {
      // Try the edge function first
      addLog("Attempting to use edge function...");
      const { data: edgeFnResult, error: edgeFnError } = await supabase.functions.invoke("access-message", {
        body: { 
          messageId, 
          deliveryId, 
          recipientEmail: recipientEmail,
          bypassSecurity: false
        }
      });
      
      if (edgeFnError) {
        addLog(`Edge function error: ${edgeFnError.message}`);
        setError(`Edge function error: ${edgeFnError.message}`);
      } else if (edgeFnResult.error) {
        addLog(`Access verification failed: ${edgeFnResult.error}`);
        setError(edgeFnResult.error);
      } else if (edgeFnResult.success) {
        // Transform the message to ensure it conforms to our expected Message type
        const transformedMessage: Message = {
          ...edgeFnResult.message,
          attachments: Array.isArray(edgeFnResult.message.attachments)
            ? edgeFnResult.message.attachments.map((att: any) => ({
                path: att.path || '',
                name: att.name || '',
                size: att.size || 0,
                type: att.type || ''
              }))
            : null,
          // Ensure expires_at and sender_name are present in the transformed message
          // Use type assertion to tell TypeScript that edgeFnResult.message might have these properties
          expires_at: (edgeFnResult.message as any).expires_at || null,
          sender_name: (edgeFnResult.message as any).sender_name || null
        };
        setMessage(transformedMessage);
        addLog(`Success! Edge function loaded message: "${edgeFnResult.message.title}"`);
      }
    } catch (e) {
      setError((e as Error).message);
      addLog(`Exception: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const loadMessageBypass = async () => {
    if (!messageId) {
      toast({
        title: "Missing Message ID",
        description: "Please provide a Message ID",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    addLog(`Bypass security message load for: ${messageId}`);
    
    try {
      const { data: edgeFnResult, error: edgeFnError } = await supabase.functions.invoke("access-message", {
        body: { 
          messageId, 
          bypassSecurity: true
        }
      });
      
      if (edgeFnError) {
        addLog(`Edge function error: ${edgeFnError.message}`);
        setError(`Edge function error: ${edgeFnError.message}`);
      } else if (edgeFnResult.error) {
        addLog(`Access verification failed: ${edgeFnResult.error}`);
        setError(edgeFnResult.error);
      } else if (edgeFnResult.success) {
        // Transform the message to ensure it conforms to our expected Message type
        const transformedMessage: Message = {
          ...edgeFnResult.message,
          attachments: Array.isArray(edgeFnResult.message.attachments)
            ? edgeFnResult.message.attachments.map((att: any) => ({
                path: att.path || '',
                name: att.name || '',
                size: att.size || 0,
                type: att.type || ''
              }))
            : null,
          // Ensure expires_at and sender_name are present in the transformed message
          // Use type assertion to tell TypeScript that edgeFnResult.message might have these properties
          expires_at: (edgeFnResult.message as any).expires_at || null,
          sender_name: (edgeFnResult.message as any).sender_name || null
        };
        setMessage(transformedMessage);
        addLog(`Success! Bypass mode loaded message: "${edgeFnResult.message.title}"`);
      }
    } catch (e) {
      setError((e as Error).message);
      addLog(`Exception: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingState />;
  }
  
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Message Access Diagnostic Tool</h1>
        
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="messageId">Message ID</Label>
              <Input 
                id="messageId" 
                value={messageId} 
                onChange={(e) => setMessageId(e.target.value)}
                placeholder="Enter message UUID" 
              />
            </div>
            
            <div>
              <Label htmlFor="deliveryId">Delivery ID</Label>
              <Input 
                id="deliveryId" 
                value={deliveryId} 
                onChange={(e) => setDeliveryId(e.target.value)}
                placeholder="Enter delivery ID" 
              />
            </div>
            
            <div>
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input 
                id="recipientEmail" 
                value={recipientEmail} 
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient email" 
                type="email"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <Button onClick={checkDelivery}>
            Check Delivery Record
          </Button>
          
          <Button variant="secondary" onClick={loadMessageDirect}>
            Load Message Direct
          </Button>
          
          <Button variant="outline" onClick={loadMessageSecure}>
            Load Message Secure
          </Button>
          
          <Button variant="destructive" onClick={loadMessageBypass}>
            Bypass Security
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <Separator className="my-6" />
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Diagnostic Logs</h3>
          <div className="bg-gray-100 rounded p-3 h-40 overflow-y-auto text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      </Card>
      
      {message && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Message Preview</h2>
          <MessageDisplay message={message} />
        </div>
      )}
    </div>
  );
}
