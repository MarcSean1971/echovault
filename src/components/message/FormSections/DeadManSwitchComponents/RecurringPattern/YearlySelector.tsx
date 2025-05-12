
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatternOptionProps } from "./types";

export function YearlySelector({ pattern, setPattern }: PatternOptionProps) {
  const handleDayChange = (day: number) => {
    if (pattern) {
      setPattern({ ...pattern, day });
    }
  };
  
  const handleMonthChange = (month: number) => {
    if (pattern) {
      setPattern({ ...pattern, month });
    }
  };
  
  return (
    <>
      <div>
        <Label className="mb-2 block">Month</Label>
        <Select
          value={pattern?.month?.toString() || "0"}
          onValueChange={(value) => handleMonthChange(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">January</SelectItem>
            <SelectItem value="1">February</SelectItem>
            <SelectItem value="2">March</SelectItem>
            <SelectItem value="3">April</SelectItem>
            <SelectItem value="4">May</SelectItem>
            <SelectItem value="5">June</SelectItem>
            <SelectItem value="6">July</SelectItem>
            <SelectItem value="7">August</SelectItem>
            <SelectItem value="8">September</SelectItem>
            <SelectItem value="9">October</SelectItem>
            <SelectItem value="10">November</SelectItem>
            <SelectItem value="11">December</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="mb-2 block">Day</Label>
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
    </>
  );
}
