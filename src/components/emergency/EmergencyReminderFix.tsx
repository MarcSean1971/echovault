
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export function EmergencyReminderFix() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleEmergencyFix = async () => {
    setIsFixing(true);
    try {
      console.log("Triggering emergency reminder fix...");
      
      const { data, error } = await supabase.functions.invoke("fix-stuck-reminder", {
        body: { debug: true }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Emergency fix result:", data);
      setResult(data);
      
      toast({
        title: "Emergency Fix Applied",
        description: "Failed reminder has been reset and email sending forced",
        duration: 5000,
      });
      
    } catch (error: any) {
      console.error("Error in emergency fix:", error);
      toast({
        title: "Fix Failed",
        description: error.message || "Could not apply emergency fix",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Emergency Reminder System Fix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-red-700">
          Critical system issue detected: Reminder not sent at scheduled time.
        </p>
        
        <Button 
          onClick={handleEmergencyFix}
          disabled={isFixing}
          variant="destructive"
          className="w-full"
        >
          {isFixing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Applying Emergency Fix...
            </>
          ) : (
            "Apply Emergency Fix Now"
          )}
        </Button>
        
        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <h4 className="font-medium text-green-800">Fix Result:</h4>
            <pre className="text-sm text-green-700 mt-2 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
