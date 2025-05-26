
import React from 'react';
import { Button } from '@/components/ui/button';
import { HOVER_TRANSITION } from '@/utils/hoverEffects';
import { reminderMonitor } from '@/services/messages/monitoring/reminderMonitor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  
  const handleForceProcessReminders = async () => {
    toast({
      title: "Processing Reminders",
      description: "Forcing immediate processing of all due reminders...",
      duration: 3000,
    });
    
    await reminderMonitor.forceProcessAllReminders();
  };
  
  const handleResetStuckReminders = async () => {
    toast({
      title: "Resetting Stuck Reminders",
      description: "Resetting any stuck reminder processes...",
      duration: 3000,
    });
    
    await reminderMonitor.manualResetAndCreateReminders();
  };
  
  const handleTestEmailService = async () => {
    toast({
      title: "Testing Email Service",
      description: "Testing email delivery functionality...",
      duration: 3000,
    });
    
    try {
      const { error } = await supabase.functions.invoke("send-test-email", {
        body: {
          debug: true,
          test: true
        }
      });
      
      if (error) {
        toast({
          title: "Email Test Failed",
          description: `Email service test failed: ${error.message}`,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Email Test Successful",
          description: "Email service is working correctly",
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast({
        title: "Email Test Error",
        description: error.message || "Unknown error testing email service",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  const handleGetSystemStats = async () => {
    const stats = await reminderMonitor.getSystemStats();
    if (stats) {
      toast({
        title: "System Statistics",
        description: `Due: ${stats.due_reminders}, Recent Sent: ${stats.sent_last_5min}, Recent Failed: ${stats.failed_last_5min}`,
        duration: 8000,
      });
    } else {
      toast({
        title: "Stats Error",
        description: "Could not retrieve system statistics",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Original diagnostic buttons */}
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
      
      {/* Critical reminder system diagnostic buttons */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3 text-red-600">🚨 Critical Reminder System Diagnostics</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleForceProcessReminders}
            variant="destructive"
            className={`${HOVER_TRANSITION} hover:scale-105`}
          >
            Force Process All Reminders
          </Button>
          
          <Button 
            onClick={handleResetStuckReminders}
            variant="outline"
            className={`${HOVER_TRANSITION} hover:scale-105`}
          >
            Reset Stuck Reminders
          </Button>
          
          <Button 
            onClick={handleTestEmailService}
            variant="secondary"
            className={`${HOVER_TRANSITION} hover:scale-105`}
          >
            Test Email Service
          </Button>
          
          <Button 
            onClick={handleGetSystemStats}
            variant="outline"
            className={`${HOVER_TRANSITION} hover:scale-105`}
          >
            Get System Stats
          </Button>
        </div>
      </div>
    </div>
  );
};
