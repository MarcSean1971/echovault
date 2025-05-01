
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface AdvancedOptionsProps {
  pinCode: string;
  setPinCode: (value: string) => void;
  unlockDelay: number;
  setUnlockDelay: (value: number) => void;
  expiryHours: number;
  setExpiryHours: (value: number) => void;
}

export function AdvancedOptions({
  pinCode,
  setPinCode,
  unlockDelay,
  setUnlockDelay,
  expiryHours,
  setExpiryHours
}: AdvancedOptionsProps) {
  return (
    <div className="pt-4 border-t">
      <h4 className="font-medium mb-3">Advanced Options</h4>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="pin-code">Recipient PIN Code (Optional)</Label>
          <Input 
            id="pin-code"
            type="text"
            placeholder="Enter a PIN code to restrict access"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Recipients will need to enter this PIN to access your message.
          </p>
        </div>
        
        <div>
          <Label>Unlock Delay (Hours)</Label>
          <div className="flex items-center space-x-4 mt-1">
            <Slider
              value={[unlockDelay]}
              onValueChange={(value) => setUnlockDelay(value[0])}
              min={0}
              max={72}
              step={1}
              className="flex-1"
            />
            <span className="font-medium w-8 text-center">{unlockDelay}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {unlockDelay > 0 
              ? `Message will be accessible ${unlockDelay} hours after triggering.`
              : "Message will be accessible immediately upon triggering."}
          </p>
        </div>
        
        <div>
          <Label>Message Expiry (Hours)</Label>
          <div className="flex items-center space-x-4 mt-1">
            <Slider
              value={[expiryHours]}
              onValueChange={(value) => setExpiryHours(value[0])}
              min={0}
              max={720}
              step={24}
              className="flex-1"
            />
            <span className="font-medium w-12 text-center">
              {expiryHours > 0 ? expiryHours : "None"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {expiryHours > 0 
              ? `Message will expire ${expiryHours} hours after delivery (${Math.floor(expiryHours / 24)} days).`
              : "Message will not expire (available forever)."}
          </p>
        </div>
      </div>
    </div>
  );
}
