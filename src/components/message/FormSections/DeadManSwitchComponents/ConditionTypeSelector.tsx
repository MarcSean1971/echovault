
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { TriggerType } from "@/types/message";
import { AlertCircle, Calendar, Bell, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConditionTypeSelectorProps {
  conditionType: TriggerType;
  setConditionType: (value: TriggerType) => void;
}

export function ConditionTypeSelector({
  conditionType,
  setConditionType
}: ConditionTypeSelectorProps) {
  return (
    <div>
      <Label className="mb-3 block font-medium">How should this message be delivered?</Label>
      <RadioGroup 
        value={conditionType}
        onValueChange={(value) => setConditionType(value as TriggerType)}
        className="space-y-4"
      >
        <div className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="no_check_in" id="no-check-in" className="mt-1" />
          <div className="space-y-1">
            <div className="flex items-center">
              <Label htmlFor="no-check-in" className="font-medium cursor-pointer">Send if I don't check in</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[220px]">Message will be sent if you don't check in before the deadline.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">Classic dead man's switch - requires regular check-ins to prevent delivery</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="scheduled_date" id="scheduled-date" className="mt-1" />
          <div className="space-y-1">
            <div className="flex items-center">
              <Label htmlFor="scheduled-date" className="font-medium cursor-pointer">Send on a specific date</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Calendar className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[220px]">Message will be delivered on the date & time you specify.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">Schedule for future delivery on a specific date and time</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="panic_trigger" id="panic-trigger" className="mt-1" />
          <div className="space-y-1">
            <div className="flex items-center">
              <Label htmlFor="panic-trigger" className="font-medium cursor-pointer">Manual panic button</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Bell className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[220px]">Creates a button you can press in an emergency to instantly deliver this message.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">For emergency situations - sends message immediately when triggered</p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
