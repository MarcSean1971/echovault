
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
  setActiveTab?: (tab: string) => void; // Added this prop as optional
}

export function SecurityOptions({
  pinCode,
  setPinCode,
  unlockDelay,
  setUnlockDelay,
  expiryHours,
  setExpiryHours,
  setActiveTab
}: SecurityOptionsProps) {
  const [open, setOpen] = useState(false);
  const [enablePin, setEnablePin] = useState(!!pinCode);
  const [enableDelay, setEnableDelay] = useState(unlockDelay > 0);
  const [enableExpiry, setEnableExpiry] = useState(expiryHours > 0);
  const [customDelaySelected, setCustomDelaySelected] = useState(
    ![6, 12, 24, 48, 72].includes(unlockDelay) && unlockDelay > 0
  );
  const [customExpirySelected, setCustomExpirySelected] = useState(
    ![48, 168, 336, 720].includes(expiryHours) && expiryHours > 0
  );

  const handlePinToggle = (checked: boolean) => {
    setEnablePin(checked);
    if (!checked) setPinCode("");
  };

  const handleDelayToggle = (checked: boolean) => {
    setEnableDelay(checked);
    if (checked) setUnlockDelay(24);
    else setUnlockDelay(0);
    setCustomDelaySelected(false);
  };

  const handleExpiryToggle = (checked: boolean) => {
    setEnableExpiry(checked);
    if (checked) setExpiryHours(168); // 1 week default
    else setExpiryHours(0);
    setCustomExpirySelected(false);
  };

  const handleDelayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setCustomDelaySelected(true);
      setUnlockDelay(unlockDelay > 0 && unlockDelay !== 6 && unlockDelay !== 12 && unlockDelay !== 24 && unlockDelay !== 48 && unlockDelay !== 72 ? unlockDelay : 24);
    } else {
      setCustomDelaySelected(false);
      setUnlockDelay(Number(value));
    }
  };

  const handleCustomDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setUnlockDelay(numValue);
    } else if (value === "") {
      setUnlockDelay(0);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setCustomExpirySelected(true);
      setExpiryHours(expiryHours > 0 && expiryHours !== 48 && expiryHours !== 168 && expiryHours !== 336 && expiryHours !== 720 ? expiryHours : 168);
    } else {
      setCustomExpirySelected(false);
      setExpiryHours(Number(value));
    }
  };

  const handleCustomExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setExpiryHours(numValue);
    } else if (value === "") {
      setExpiryHours(0);
    }
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
            <div className="space-y-2">
              <select
                id="delay-hours"
                value={customDelaySelected ? "custom" : unlockDelay.toString()}
                onChange={handleDelayChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours (1 day)</option>
                <option value="48">48 hours (2 days)</option>
                <option value="72">72 hours (3 days)</option>
                <option value="custom">Custom (hours)</option>
              </select>
              
              {customDelaySelected && (
                <div className="mt-2">
                  <Label htmlFor="custom-delay-hours">Custom delay (hours)</Label>
                  <Input
                    id="custom-delay-hours"
                    type="number"
                    min="1"
                    value={unlockDelay}
                    onChange={handleCustomDelayChange}
                    placeholder="Enter hours"
                    className="mt-1"
                  />
                </div>
              )}
              
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
            <div className="space-y-2">
              <select
                id="expiry-hours"
                value={customExpirySelected ? "custom" : expiryHours.toString()}
                onChange={handleExpiryChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="48">48 hours (2 days)</option>
                <option value="168">168 hours (1 week)</option>
                <option value="336">336 hours (2 weeks)</option>
                <option value="720">720 hours (30 days)</option>
                <option value="custom">Custom (hours)</option>
              </select>
              
              {customExpirySelected && (
                <div className="mt-2">
                  <Label htmlFor="custom-expiry-hours">Custom expiry (hours)</Label>
                  <Input
                    id="custom-expiry-hours"
                    type="number"
                    min="1"
                    value={expiryHours}
                    onChange={handleCustomExpiryChange}
                    placeholder="Enter hours"
                    className="mt-1"
                  />
                </div>
              )}
              
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
