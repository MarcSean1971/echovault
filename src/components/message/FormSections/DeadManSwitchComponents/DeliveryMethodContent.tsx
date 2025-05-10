
import { useState, useEffect } from "react";
import { TriggerType } from "@/types/message";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioCardOption } from "./RadioCardOption";
import { NoCheckInSection } from "./NoCheckInSection";
import { ScheduledMessageSection } from "./ScheduledMessageSection";
import { Label } from "@/components/ui/label";
import { PanicTrigger } from "./PanicTrigger";
import { PanicTriggerConfig } from "@/types/message";

interface DeliveryMethodContentProps {
  conditionType: TriggerType;
  setConditionType: (type: TriggerType) => void;
  
  // For no check-in
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (value: number) => void;
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
  
  // For scheduled messages
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  
  // For recurring patterns
  recurringPattern: any;
  setRecurringPattern: (pattern: any) => void;
  
  // For panic trigger config
  panicTriggerConfig: PanicTriggerConfig | undefined;
  setPanicTriggerConfig: (config: PanicTriggerConfig) => void;
  
  // For delivery option
  deliveryOption: string;
  setDeliveryOption: (option: string) => void;
  
  // Optional properties
  setActiveTab?: (tab: string) => void;
  checkInCode?: string;
  setCheckInCode?: (code: string) => void;
}

export function DeliveryMethodContent({
  conditionType,
  setConditionType,
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  reminderHours,
  setReminderHours,
  triggerDate,
  setTriggerDate,
  recurringPattern,
  setRecurringPattern,
  panicTriggerConfig,
  setPanicTriggerConfig,
  deliveryOption,
  setDeliveryOption,
  checkInCode,
  setCheckInCode
}: DeliveryMethodContentProps) {
  // When conditionType or component mounts, ensure we have a default panic config
  useEffect(() => {
    if (conditionType === "panic_button" && !panicTriggerConfig) {
      setPanicTriggerConfig({
        enabled: true,
        methods: ["app"],
        cancel_window_seconds: 30,
        bypass_logging: false,
        keep_armed: false
      });
    }
  }, [conditionType, panicTriggerConfig, setPanicTriggerConfig]);
  
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          How should this message be triggered?
        </Label>
        <RadioGroup 
          value={conditionType} 
          onValueChange={(value) => setConditionType(value as TriggerType)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <RadioCardOption
            value="no_check_in"
            id="condition-no-check-in"
            label="If I don't check in"
            description="Message gets sent if you don't check in within a time period"
            isSelected={conditionType === "no_check_in"}
          />
          
          <RadioCardOption
            value="scheduled"
            id="condition-scheduled"
            label="On a scheduled date"
            description="Message gets sent on a specific date you choose"
            isSelected={conditionType === "scheduled"}
          />
          
          <RadioCardOption
            value="panic_button"
            id="condition-panic"
            label="Emergency button"
            description="Message gets sent when you press a panic button"
            isSelected={conditionType === "panic_button"}
          />
          
          <RadioCardOption
            value="manual_trigger"
            id="condition-manual"
            label="Manual trigger only"
            description="You'll need to manually trigger this message"
            isSelected={conditionType === "manual_trigger"}
          />
        </RadioGroup>
      </div>
      
      {/* Show appropriate configuration based on selected condition type */}
      <div className="pt-4 border-t">
        {conditionType === "no_check_in" && (
          <NoCheckInSection 
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
            minutesThreshold={minutesThreshold}
            setMinutesThreshold={setMinutesThreshold}
            recurringPattern={recurringPattern}
            setRecurringPattern={setRecurringPattern}
            triggerDate={triggerDate || undefined}
            setTriggerDate={(date) => setTriggerDate(date || null)}
            reminderHours={reminderHours}
            setReminderHours={setReminderHours}
          />
        )}
        
        {conditionType === "scheduled" && (
          <ScheduledMessageSection 
            triggerDate={triggerDate}
            setTriggerDate={setTriggerDate}
            recurringPattern={recurringPattern}
            setRecurringPattern={setRecurringPattern}
          />
        )}
        
        {conditionType === "panic_button" && panicTriggerConfig && (
          <PanicTrigger
            config={panicTriggerConfig}
            setConfig={setPanicTriggerConfig}
          />
        )}
        
        {conditionType === "manual_trigger" && (
          <div className="text-sm text-muted-foreground">
            <p>This message will not be sent automatically. You'll need to manually trigger it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
