
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PanicTriggerConfig } from "@/types/message";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect } from "react";
import { Smartphone } from "lucide-react";

interface PanicTriggerProps {
  config: PanicTriggerConfig;
  setConfig: (config: PanicTriggerConfig) => void;
}

export function PanicTrigger({ config, setConfig }: PanicTriggerProps) {
  // Ensure panic config has all required fields with defaults
  useEffect(() => {
    // Make sure all required fields are set
    const updatedConfig = {
      enabled: config.enabled ?? true,
      methods: config.methods ?? ['app'],
      cancel_window_seconds: config.cancel_window_seconds ?? 10,
      bypass_logging: config.bypass_logging ?? false,
      keep_armed: config.keep_armed ?? true, // Default to keeping armed for safety
    };
    
    // Only update if the values are actually different to prevent loops
    if (JSON.stringify(updatedConfig) !== JSON.stringify(config)) {
      console.log("Initializing panic config with defaults:", updatedConfig);
      setConfig(updatedConfig);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="mb-2 block">How do you want to trigger this message?</Label>
          <RadioGroup 
            value={config.methods?.includes('app') ? 'app' : 'whatsapp'} 
            onValueChange={(value) => {
              if (value === 'app') {
                setConfig({...config, methods: ['app']});
              } else {
                setConfig({...config, methods: ['whatsapp']});
              }
            }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-2 rounded border">
              <RadioGroupItem value="app" id="method-app" />
              <Label htmlFor="method-app" className="cursor-pointer">App button (press and hold to send)</Label>
            </div>
            
            <div className="flex items-center space-x-2 p-2 rounded border">
              <RadioGroupItem value="whatsapp" id="method-whatsapp" />
              <Label htmlFor="method-whatsapp" className="cursor-pointer">WhatsApp keyword (send a special word to trigger)</Label>
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
        
        <div className="flex items-center justify-between">
          <Label htmlFor="keep-armed" className="font-medium text-orange-600">Keep message armed after triggering</Label>
          <Switch
            id="keep-armed"
            checked={config.keep_armed ?? true}
            onCheckedChange={(checked) => {
              console.log(`Setting keep_armed to ${checked}`);
              setConfig({...config, keep_armed: checked});
            }}
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
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <details>
            <summary>Debug: Current Panic Config</summary>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
