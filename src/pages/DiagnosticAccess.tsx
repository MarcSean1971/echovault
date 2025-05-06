
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Message } from '@/types/message';
import { MessageDisplay } from '@/components/message/public-access/MessageDisplay';
import { LoadingState } from '@/components/message/public-access/LoadingState';
import { DiagnosticForm } from '@/components/diagnostic/DiagnosticForm';
import { DiagnosticLogs } from '@/components/diagnostic/DiagnosticLogs';
import { 
  checkDeliveryRecord,
  loadMessageDirect,
  loadMessageSecure,
  loadMessageBypass
} from '@/services/diagnostic/messageAccessService';

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
  
  const handleCheckDelivery = async () => {
    setLoading(true);
    await checkDeliveryRecord(messageId, deliveryId, addLog);
    setLoading(false);
  };
  
  const handleLoadMessageDirect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadMessageDirect(messageId, addLog);
      if (result) {
        setMessage(result);
      }
    } catch (e) {
      setError((e as Error).message);
      addLog(`Exception: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadMessageSecure = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadMessageSecure(messageId, deliveryId, recipientEmail, addLog);
      if (result) {
        setMessage(result);
      }
    } catch (e) {
      setError((e as Error).message);
      addLog(`Exception: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadMessageBypass = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadMessageBypass(messageId, addLog);
      if (result) {
        setMessage(result);
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
        
        <DiagnosticForm 
          messageId={messageId}
          deliveryId={deliveryId}
          recipientEmail={recipientEmail}
          onMessageIdChange={setMessageId}
          onDeliveryIdChange={setDeliveryId}
          onRecipientEmailChange={setRecipientEmail}
          onCheckDelivery={handleCheckDelivery}
          onLoadMessageDirect={handleLoadMessageDirect}
          onLoadMessageSecure={handleLoadMessageSecure}
          onLoadMessageBypass={handleLoadMessageBypass}
        />
        
        <Separator className="my-6" />
        
        <DiagnosticLogs 
          logs={logs}
          error={error}
        />
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
