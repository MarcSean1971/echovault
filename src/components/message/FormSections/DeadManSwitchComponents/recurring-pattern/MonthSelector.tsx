
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthSelectorProps {
  month?: number;
  onMonthChange: (month: number) => void;
}

export function MonthSelector({ month = 0, onMonthChange }: MonthSelectorProps) {
  return (
    <div>
      <Label className="mb-2 block">Month</Label>
      <Select
        value={month?.toString() || "0"}
        onValueChange={(value) => onMonthChange(Number(value))}
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
  );
}
