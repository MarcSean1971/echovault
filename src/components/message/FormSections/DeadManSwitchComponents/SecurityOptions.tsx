
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";

interface SecurityOptionsProps {
  pinCode: string;
  setPinCode: (value: string) => void;
  unlockDelay: number;
  setUnlockDelay: (value: number) => void;
  expiryHours: number;
  setExpiryHours: (value: number) => void;
}

export function SecurityOptions({
  pinCode,
  setPinCode,
  unlockDelay,
  setUnlockDelay,
  expiryHours,
  setExpiryHours
}: SecurityOptionsProps) {
  const [open, setOpen] = useState(false);
  const [enablePin, setEnablePin] = useState(!!pinCode);
  const [enableDelay, setEnableDelay] = useState(unlockDelay > 0);
  const [enableExpiry, setEnableExpiry] = useState(expiryHours > 0);

  const handlePinToggle = (checked: boolean) => {
    setEnablePin(checked);
    if (!checked) setPinCode("");
  };

  const handleDelayToggle = (checked: boolean) => {
    setEnableDelay(checked);
    if (checked) setUnlockDelay(24);
    else setUnlockDelay(0);
  };

  const handleExpiryToggle = (checked: boolean) => {
    setEnableExpiry(checked);
    if (checked) setExpiryHours(168); // 1 week default
    else setExpiryHours(0);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border rounded-md px-4 py-3 mt-4"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Lock className="h-4 w-4 mr-2" />
          <span className="font-medium">Security Options</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 mt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-pin">Require PIN to view message</Label>
            <Switch id="enable-pin" checked={enablePin} onCheckedChange={handlePinToggle} />
          </div>
          
          {enablePin && (
            <div>
              <Input
                id="pin-code"
                type="text"
                placeholder="Enter a PIN code (numbers only)"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="mt-1"
                maxLength={6}
                pattern="[0-9]*"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recipients will need to enter this PIN to view your message.
              </p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-delay">Delay access after delivery</Label>
            <Switch id="enable-delay" checked={enableDelay} onCheckedChange={handleDelayToggle} />
          </div>
          
          {enableDelay && (
            <div>
              <select
                id="delay-hours"
                value={unlockDelay}
                onChange={(e) => setUnlockDelay(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours (1 day)</option>
                <option value="48">48 hours (2 days)</option>
                <option value="72">72 hours (3 days)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Recipients cannot access content until this time has passed after delivery.
              </p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-expiry">Message expires after</Label>
            <Switch id="enable-expiry" checked={enableExpiry} onCheckedChange={handleExpiryToggle} />
          </div>
          
          {enableExpiry && (
            <div>
              <select
                id="expiry-hours"
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="48">48 hours (2 days)</option>
                <option value="168">168 hours (1 week)</option>
                <option value="336">336 hours (2 weeks)</option>
                <option value="720">720 hours (30 days)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Message will self-destruct after this period has passed.
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
