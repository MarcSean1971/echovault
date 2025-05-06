
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DiagnosticFormProps {
  messageId: string;
  deliveryId: string;
  recipientEmail: string;
  onMessageIdChange: (value: string) => void;
  onDeliveryIdChange: (value: string) => void;
  onRecipientEmailChange: (value: string) => void;
  onCheckDelivery: () => void;
  onLoadMessageDirect: () => void;
  onLoadMessageSecure: () => void;
  onLoadMessageBypass: () => void;
}

export const DiagnosticForm: React.FC<DiagnosticFormProps> = ({
  messageId,
  deliveryId,
  recipientEmail,
  onMessageIdChange,
  onDeliveryIdChange,
  onRecipientEmailChange,
  onCheckDelivery,
  onLoadMessageDirect,
  onLoadMessageSecure,
  onLoadMessageBypass
}) => {
  return (
    <>
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="messageId">Message ID</Label>
            <Input 
              id="messageId" 
              value={messageId} 
              onChange={(e) => onMessageIdChange(e.target.value)}
              placeholder="Enter message UUID" 
            />
          </div>
          
          <div>
            <Label htmlFor="deliveryId">Delivery ID</Label>
            <Input 
              id="deliveryId" 
              value={deliveryId} 
              onChange={(e) => onDeliveryIdChange(e.target.value)}
              placeholder="Enter delivery ID" 
            />
          </div>
          
          <div>
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input 
              id="recipientEmail" 
              value={recipientEmail} 
              onChange={(e) => onRecipientEmailChange(e.target.value)}
              placeholder="Enter recipient email" 
              type="email"
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          onClick={onCheckDelivery}
          className="transition-transform hover:scale-105"
        >
          Check Delivery Record
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={onLoadMessageDirect}
          className="transition-transform hover:scale-105"
        >
          Load Message Direct
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onLoadMessageSecure}
          className="transition-transform hover:scale-105"
        >
          Load Message Secure
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={onLoadMessageBypass}
          className="transition-transform hover:scale-105"
        >
          Bypass Security
        </Button>
      </div>
    </>
  );
};
