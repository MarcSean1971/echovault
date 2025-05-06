
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DiagnosticButtons } from './DiagnosticButtons';

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
      
      <DiagnosticButtons
        onCheckDelivery={onCheckDelivery}
        onLoadMessageDirect={onLoadMessageDirect}
        onLoadMessageSecure={onLoadMessageSecure}
        onLoadMessageBypass={onLoadMessageBypass}
      />
    </>
  );
};
