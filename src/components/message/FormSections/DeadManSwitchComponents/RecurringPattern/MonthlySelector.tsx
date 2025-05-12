
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatternOptionProps } from "./types";

export function MonthlySelector({ pattern, setPattern }: PatternOptionProps) {
  const handleDayChange = (day: number) => {
    if (pattern) {
      setPattern({ ...pattern, day });
    }
  };
  
  return (
    <div>
      <Label className="mb-2 block">On day of month</Label>
      <Select
        value={pattern?.day?.toString() || "1"}
        onValueChange={(value) => handleDayChange(Number(value))}
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
