
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus } from "lucide-react";
import { useHoverEffects } from "@/hooks/useHoverEffects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ReminderFormUIProps {
  newHour: string;
  newMinute: string;
  validationError: string | null;
  maxMinutesValue: number;
  minuteOptions: number[];
  handleHourChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMinuteChange: (value: string) => void;
  handleAddReminder: () => void;
  isDisabled: boolean;
}

export function ReminderFormUI({
  newHour,
  newMinute,
  validationError,
  maxMinutesValue,
  minuteOptions,
  handleHourChange,
  handleMinuteChange,
  handleAddReminder,
  isDisabled
}: ReminderFormUIProps) {
  const { getIconHoverClasses } = useHoverEffects();
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <div>
          <Label htmlFor="reminder-hours" className="text-xs">Hours</Label>
          <Input
            id="reminder-hours"
            type="number"
            min="0"
            placeholder="0"
            value={newHour}
            onChange={handleHourChange}
            className="w-20 hover:border-primary/50 focus:border-primary transition-colors"
          />
        </div>
        
        <div>
          <Label htmlFor="reminder-minutes" className="text-xs">Minutes</Label>
          <Select
            value={newMinute}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger id="reminder-minutes" className="w-24 hover:border-primary/50 focus:border-primary transition-colors">
              <SelectValue placeholder="0" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions
                .filter(option => option <= maxMinutesValue)
                .map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant="secondary" 
                size="icon"
                onClick={handleAddReminder}
                disabled={isDisabled}
              >
                <Plus className={getIconHoverClasses("primary")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add reminder</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {validationError && (
        <div className="flex items-center text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground mt-1">
        Reminders must be set at 15-minute intervals to align with the system schedule.
      </p>
    </div>
  );
}
