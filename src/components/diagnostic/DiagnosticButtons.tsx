
import React from 'react';
import { Button } from '@/components/ui/button';
import { HOVER_TRANSITION } from '@/utils/hoverEffects';

interface DiagnosticButtonsProps {
  onCheckDelivery: () => void;
  onLoadMessageDirect: () => void;
  onLoadMessageSecure: () => void;
  onLoadMessageBypass: () => void;
}

export const DiagnosticButtons: React.FC<DiagnosticButtonsProps> = ({
  onCheckDelivery,
  onLoadMessageDirect,
  onLoadMessageSecure,
  onLoadMessageBypass
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button 
        onClick={onCheckDelivery}
        className={`${HOVER_TRANSITION} hover:scale-105`}
      >
        Check Delivery Record
      </Button>
      
      <Button 
        variant="secondary" 
        onClick={onLoadMessageDirect}
        className={`${HOVER_TRANSITION} hover:scale-105`}
      >
        Load Message Direct
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onLoadMessageSecure}
        className={`${HOVER_TRANSITION} hover:scale-105`}
      >
        Load Message Secure
      </Button>
      
      <Button 
        variant="destructive" 
        onClick={onLoadMessageBypass}
        className={`${HOVER_TRANSITION} hover:scale-105`}
      >
        Bypass Security
      </Button>
    </div>
  );
};
