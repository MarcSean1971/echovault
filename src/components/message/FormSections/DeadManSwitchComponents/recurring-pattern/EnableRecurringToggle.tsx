
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface EnableRecurringToggleProps {
  isRecurring: boolean;
  onToggle: (isEnabled: boolean) => void;
  forceEnabled?: boolean;
}

export function EnableRecurringToggle({
  isRecurring,
  onToggle,
  forceEnabled = false,
}: EnableRecurringToggleProps) {
  if (forceEnabled) return null;

  return (
    <div>
      <Label className="mb-2 block">Make this recurring?</Label>
      <RadioGroup 
        value={isRecurring ? "yes" : "no"} 
        onValueChange={(value) => onToggle(value === "yes")}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id="recurring-yes" />
          <Label htmlFor="recurring-yes">Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id="recurring-no" />
          <Label htmlFor="recurring-no">No</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
