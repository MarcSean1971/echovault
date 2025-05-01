import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Send } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PanicTriggerConfig } from "@/types/message";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PanicTriggerProps {
  config: PanicTriggerConfig;
  setConfig: (config: PanicTriggerConfig) => void;
}

export function PanicTrigger({ config, setConfig }: PanicTriggerProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-medium">
          Emergency Panic Button
        </AlertTitle>
        <AlertDescription className="text-sm">
          This creates a button that you can press in an emergency to send your message instantly.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="mb-2 block">How do you want to trigger this message?</Label>
          <RadioGroup 
            value={config.methods.includes('app') ? 'app' : 'sms'} 
            onValueChange={(value) => {
              if (value === 'app') {
                setConfig({...config, methods: ['app']});
              } else {
                setConfig({...config, methods: ['sms']});
              }
            }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-2 rounded border">
              <RadioGroupItem value="app" id="method-app" />
              <Label htmlFor="method-app" className="cursor-pointer">App button (press and hold to send)</Label>
            </div>
            
            <div className="flex items-center space-x-2 p-2 rounded border">
              <RadioGroupItem value="sms" id="method-sms" />
              <Label htmlFor="method-sms" className="cursor-pointer">SMS keyword (text a special word to trigger)</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="bypass-logging">Enhanced privacy (bypass logging)</Label>
          <Switch
            id="bypass-logging"
            checked={config.bypass_logging}
            onCheckedChange={(checked) => setConfig({...config, bypass_logging: checked})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cancel-window">Cancellation window</Label>
          <select
            id="cancel-window" 
            value={config.cancel_window_seconds}
            onChange={(e) => setConfig({
              ...config,
              cancel_window_seconds: parseInt(e.target.value)
            })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="0">No cancellation window</option>
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
            <option value="15">15 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">60 seconds</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {config.cancel_window_seconds > 0 
              ? `You'll have ${config.cancel_window_seconds} seconds to cancel after triggering`
              : "Message will send immediately without option to cancel"}
          </p>
        </div>
      </div>
    </div>
  );
}
