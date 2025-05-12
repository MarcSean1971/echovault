
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RecurringPatternProps } from "./types";

interface RecurringToggleProps {
  isRecurring: boolean;
  onRecurringChange: (value: string) => void;
}

export function RecurringToggle({ isRecurring, onRecurringChange }: RecurringToggleProps) {
  return (
    <div>
      <Label className="mb-2 block">Make this recurring?</Label>
      <RadioGroup 
        value={isRecurring ? "yes" : "no"} 
        onValueChange={onRecurringChange}
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
