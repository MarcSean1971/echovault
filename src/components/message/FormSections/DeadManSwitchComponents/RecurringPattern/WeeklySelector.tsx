
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatternOptionProps } from "./types";

export function WeeklySelector({ pattern, setPattern }: PatternOptionProps) {
  const handleDayChange = (day: number) => {
    if (pattern) {
      setPattern({ ...pattern, day });
    }
  };
  
  return (
    <div>
      <Label className="mb-2 block">On day</Label>
      <Select 
        value={pattern?.day?.toString() || "0"}
        onValueChange={(value) => handleDayChange(Number(value))}
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
