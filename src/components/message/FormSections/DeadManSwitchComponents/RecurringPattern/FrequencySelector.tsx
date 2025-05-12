
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatternOptionProps, RecurringPatternType } from "./types";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function FrequencySelector({ pattern, setPattern }: PatternOptionProps) {
  const handleTypeChange = (type: RecurringPatternType) => {
    if (pattern) {
      setPattern({ ...pattern, type });
    } else {
      setPattern({ type, interval: 1 });
    }
  };
  
  return (
    <div>
      <Label htmlFor="recurring-type" className="mb-2 block">Repeat</Label>
      <Select 
        value={pattern?.type || 'daily'}
        onValueChange={(value) => handleTypeChange(value as RecurringPatternType)}
      >
        <SelectTrigger id="recurring-type" className={`hover:border-primary/50 ${HOVER_TRANSITION}`}>
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
