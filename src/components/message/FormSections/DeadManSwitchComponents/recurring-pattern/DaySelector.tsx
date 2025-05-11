
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecurringPatternType } from "./RecurringPatternType";

interface DaySelectorProps {
  type: RecurringPatternType;
  day?: number;
  onDayChange: (day: number) => void;
}

export function DaySelector({ type, day = 0, onDayChange }: DaySelectorProps) {
  if (type !== 'weekly' && type !== 'monthly' && type !== 'yearly') {
    return null;
  }

  if (type === 'weekly') {
    return (
      <div>
        <Label className="mb-2 block">On day</Label>
        <Select 
          value={day?.toString() || "0"}
          onValueChange={(value) => onDayChange(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Sunday</SelectItem>
            <SelectItem value="1">Monday</SelectItem>
            <SelectItem value="2">Tuesday</SelectItem>
            <SelectItem value="3">Wednesday</SelectItem>
            <SelectItem value="4">Thursday</SelectItem>
            <SelectItem value="5">Friday</SelectItem>
            <SelectItem value="6">Saturday</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  const label = type === 'monthly' ? 'On day of month' : 'Day';

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Select
        value={day?.toString() || "1"}
        onValueChange={(value) => onDayChange(Number(value))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select day" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({length: 31}, (_, i) => (
            <SelectItem key={i} value={(i + 1).toString()}>
              {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
