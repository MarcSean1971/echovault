
import { useState, useEffect } from "react";
import { RecurringPattern } from "@/types/message";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export interface RecurringPatternSelectorProps {
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
}

export function RecurringPatternSelector({
  recurringPattern,
  setRecurringPattern
}: RecurringPatternSelectorProps) {
  const [type, setType] = useState<string>(recurringPattern?.type || "daily");
  const [interval, setInterval] = useState<number>(recurringPattern?.interval || 1);
  const [day, setDay] = useState<number | undefined>(recurringPattern?.day);
  const [month, setMonth] = useState<number | undefined>(recurringPattern?.month);
  
  // Update the recurring pattern when inputs change
  useEffect(() => {
    if (type) {
      const newPattern: RecurringPattern = {
        type: type as "daily" | "weekly" | "monthly" | "yearly",
        interval: interval || 1
      };
      
      if (type === "monthly" || type === "yearly") {
        newPattern.day = day || 1;
      }
      
      if (type === "yearly") {
        newPattern.month = month || 1;
      }
      
      setRecurringPattern(newPattern);
    } else {
      setRecurringPattern(null);
    }
  }, [type, interval, day, month, setRecurringPattern]);
  
  return (
    <div className={`space-y-4 ${HOVER_TRANSITION}`}>
      <div className="space-y-2">
        <Label>Repeat pattern</Label>
        <Select 
          value={type} 
          onValueChange={setType}
        >
          <SelectTrigger className="w-full">
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
      
      <div className="space-y-2">
        <Label>Repeat every</Label>
        <div className="flex items-center space-x-2">
          <Input 
            type="number" 
            min={1} 
            max={99}
            value={interval} 
            onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
            className="w-20" 
          />
          <span>{type === "daily" ? "days" : type === "weekly" ? "weeks" : type === "monthly" ? "months" : "years"}</span>
        </div>
      </div>
      
      {(type === "monthly" || type === "yearly") && (
        <div className="space-y-2">
          <Label>On day</Label>
          <Input 
            type="number" 
            min={1} 
            max={31}
            value={day || 1} 
            onChange={(e) => setDay(parseInt(e.target.value) || 1)}
            className="w-20" 
          />
        </div>
      )}
      
      {type === "yearly" && (
        <div className="space-y-2">
          <Label>In month</Label>
          <Select 
            value={String(month || 1)} 
            onValueChange={(value) => setMonth(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
