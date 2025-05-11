
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RecurringPatternType } from "./RecurringPatternType";

interface IntervalSelectorProps {
  type: RecurringPatternType;
  interval: number;
  onIntervalChange: (interval: number) => void;
}

export function IntervalSelector({ type, interval, onIntervalChange }: IntervalSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    onIntervalChange(Math.max(1, value));
  };
  
  const getLabel = () => {
    switch (type) {
      case 'daily': return ' X days';
      case 'weekly': return ' X weeks';
      case 'monthly': return ' X months';
      case 'yearly': return ' X years';
      default: return '';
    }
  };
  
  return (
    <div>
      <Label htmlFor="recurring-interval" className="mb-2 block">
        Every{getLabel()}
      </Label>
      <Input
        id="recurring-interval"
        type="number"
        min={1}
        value={interval}
        onChange={handleChange}
      />
    </div>
  );
}
