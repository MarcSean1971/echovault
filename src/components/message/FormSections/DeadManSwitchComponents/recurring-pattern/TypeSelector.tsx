
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecurringPatternType } from "./RecurringPatternType";

interface TypeSelectorProps {
  type: RecurringPatternType;
  onTypeChange: (type: RecurringPatternType) => void;
}

export function TypeSelector({ type, onTypeChange }: TypeSelectorProps) {
  return (
    <div>
      <Label htmlFor="recurring-type" className="mb-2 block">Repeat</Label>
      <Select 
        value={type}
        onValueChange={(value) => onTypeChange(value as RecurringPatternType)}
      >
        <SelectTrigger id="recurring-type">
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
