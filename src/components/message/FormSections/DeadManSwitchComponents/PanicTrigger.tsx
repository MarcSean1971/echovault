
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { PanicTriggerConfig } from "@/types/message";

interface PanicTriggerProps {
  config: PanicTriggerConfig;
  setConfig: (config: PanicTriggerConfig) => void;
}

export function PanicTrigger({ config, setConfig }: PanicTriggerProps) {
  const toggleMethod = (method: 'app' | 'sms' | 'email') => {
    const methods = config.methods.includes(method)
      ? config.methods.filter(m => m !== method)
      : [...config.methods, method];
    
    setConfig({
      ...config,
      methods: methods.length > 0 ? methods : ['app'] // Always keep at least one method
    });
  };
  
  const setSmsDetails = (keyword?: string, number?: string) => {
    setConfig({
      ...config,
      sms_keyword: keyword,
      sms_number: number
    });
  };
  
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <AlertTriangle className="h-4 w-4 text-yellow-800 dark:text-yellow-200" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200 font-medium">
          Manual Panic Trigger
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
          This will create a message that you can manually trigger in an emergency situation.
          A panic button will be available for you to send this message instantly when needed.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="bypass-logging">Bypass logging (enhanced privacy)</Label>
          <Switch
            id="bypass-logging"
            checked={config.bypass_logging}
            onCheckedChange={(checked) => setConfig({...config, bypass_logging: checked})}
          />
        </div>
        
        <div className="space-y-2">
          <Label className="mb-1 block">Trigger Methods</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="method-app" 
                checked={config.methods.includes('app')}
                onCheckedChange={() => toggleMethod('app')}
              />
              <Label htmlFor="method-app">App button (hold-to-trigger)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="method-sms" 
                checked={config.methods.includes('sms')}
                onCheckedChange={() => toggleMethod('sms')}
              />
              <Label htmlFor="method-sms">SMS keyword</Label>
            </div>
            
            {config.methods.includes('sms') && (
              <div className="pl-6 space-y-2 pt-2">
                <div>
                  <Label htmlFor="sms-keyword">SMS Keyword</Label>
                  <Input
                    id="sms-keyword"
                    className="mt-1"
                    placeholder="e.g., PANIC123"
                    value={config.sms_keyword || ''}
                    onChange={(e) => setSmsDetails(e.target.value, config.sms_number)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sms-number">Send to Number</Label>
                  <Input
                    id="sms-number"
                    className="mt-1"
                    placeholder="e.g., +12025550123"
                    value={config.sms_number || ''}
                    onChange={(e) => setSmsDetails(config.sms_keyword, e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="method-email" 
                checked={config.methods.includes('email')}
                onCheckedChange={() => toggleMethod('email')}
              />
              <Label htmlFor="method-email">Email link</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Cancel Window ({config.cancel_window_seconds} seconds)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              value={[config.cancel_window_seconds]}
              min={0}
              max={60}
              step={5}
              className="flex-1"
              onValueChange={([value]) => setConfig({
                ...config,
                cancel_window_seconds: value
              })}
            />
            <span className="w-8 text-center">{config.cancel_window_seconds}s</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {config.cancel_window_seconds > 0 
              ? `You'll have ${config.cancel_window_seconds} seconds to cancel after triggering`
              : "No cancel window - message will send immediately"}
          </p>
        </div>
      </div>
    </div>
  );
}
