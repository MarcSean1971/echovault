import { Button } from "@/components/ui/button";
import { CustomTimeInput } from "./CustomTimeInput";
import { ConditionTypeSelector } from "./ConditionTypeSelector";
import { TimeThresholdSelector } from "./TimeThresholdSelector";
import { ReminderSettings } from "./ReminderSettings";
import { NoCheckInDeliveryOptions } from "./NoCheckInDeliveryOptions";
import { GroupConfirmation } from "./GroupConfirmation";
import { InactivityToDate } from "./InactivityToDate";
import { InactivityToRecurring } from "./InactivityToRecurring";
import { PanicTrigger } from "./PanicTrigger";
import { TriggerType, DeliveryOption, RecurringPattern, PanicTriggerConfig } from "@/types/message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeliveryMethodContentProps {
  conditionType: TriggerType;
  setConditionType: (type: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (minutes: number) => void;
  deliveryOption: DeliveryOption;
  setDeliveryOption: (option: DeliveryOption) => void;
  recurringPattern: RecurringPattern | null;
  setRecurringPattern: (pattern: RecurringPattern | null) => void;
  triggerDate: Date | null;
  setTriggerDate: (date: Date | null) => void;
  panicTriggerConfig: PanicTriggerConfig | undefined;
  setPanicTriggerConfig: (config: PanicTriggerConfig) => void;
  reminderHours: number[];
  setReminderHours: (hours: number[]) => void;
  setActiveTab: (tab: string) => void;
  checkInCode: string;
  setCheckInCode: (code: string) => void;
}

export function DeliveryMethodContent({
  conditionType,
  setConditionType,
  hoursThreshold,
  setHoursThreshold,
  minutesThreshold,
  setMinutesThreshold,
  deliveryOption,
  setDeliveryOption,
  recurringPattern,
  setRecurringPattern,
  triggerDate,
  setTriggerDate,
  panicTriggerConfig,
  setPanicTriggerConfig,
  reminderHours,
  setReminderHours,
  setActiveTab,
  checkInCode,
  setCheckInCode
}: DeliveryMethodContentProps) {
  
  // Initialize default panicTriggerConfig if not provided
  const defaultPanicConfig: PanicTriggerConfig = {
    enabled: true,
    methods: ['app'],
    cancel_window_seconds: 10,
    bypass_logging: false,
    keep_armed: false
  };

  // Ensure we have a valid config object
  const handlePanicConfigUpdate = (config: PanicTriggerConfig) => {
    setPanicTriggerConfig(config);
    console.log("Updated panic trigger config:", config);
  };
  
  // Custom check-in code validation
  const isValidCheckInCode = (code: string) => {
    return /^[A-Za-z0-9]+$/.test(code) || code === "";
  };
  
  // Render the custom check-in code input
  const renderCustomCheckInCode = () => {
    // Only show for check-in related condition types
    if (conditionType !== 'no_check_in' && conditionType !== 'regular_check_in') return null;
    
    return (
      <div className="space-y-2">
        <Label htmlFor="check-in-code">Custom WhatsApp Check-In Code</Label>
        <Input
          id="check-in-code"
          placeholder="CHECKIN" 
          value={checkInCode}
          onChange={(e) => {
            const value = e.target.value.trim();
            if (isValidCheckInCode(value)) {
              setCheckInCode(value);
            }
          }}
          className="max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          Set a custom code for WhatsApp check-ins. Default codes "CHECKIN" and "CODE" will still work.
        </p>
        {checkInCode && !isValidCheckInCode(checkInCode) && (
          <div className="flex items-center text-amber-600 text-sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span>Code can only contain letters and numbers without spaces.</span>
          </div>
        )}
      </div>
    );
  };
  
  // Render different options based on selected condition type
  const renderConditionOptions = () => {
    switch (conditionType) {
      case 'no_check_in':
        return (
          <div className="space-y-6">
            <CustomTimeInput
              hours={hoursThreshold}
              setHours={setHoursThreshold}
              minutes={minutesThreshold}
              setMinutes={setMinutesThreshold}
              label="Time without check-in before message is sent"
            />
            {/* Moved ReminderSettings to be immediately after the CustomTimeInput */}
            <ReminderSettings
              reminderHours={reminderHours}
              setReminderHours={setReminderHours}
            />
            <NoCheckInDeliveryOptions
              deliveryOption={deliveryOption}
              setDeliveryOption={setDeliveryOption}
              recurringPattern={recurringPattern}
              setRecurringPattern={setRecurringPattern}
              triggerDate={triggerDate}
              setTriggerDate={setTriggerDate}
            />
            {/* Add custom check-in code input */}
            {renderCustomCheckInCode()}
          </div>
        );
        
      case 'regular_check_in':
        return (
          <div className="space-y-6">
            <TimeThresholdSelector
              conditionType={conditionType}
              hoursThreshold={hoursThreshold}
              setHoursThreshold={setHoursThreshold}
            />
            {/* Add custom check-in code input */}
            {renderCustomCheckInCode()}
          </div>
        );
        
      case 'group_confirmation':
        return (
          <GroupConfirmation
            confirmationsRequired={3}
            setConfirmationsRequired={() => {}}
          />
        );
        
      case 'panic_trigger':
        return (
          <PanicTrigger
            config={panicTriggerConfig || defaultPanicConfig}
            setConfig={handlePanicConfigUpdate}
          />
        );
        
      case 'inactivity_to_recurring':
        return (
          <InactivityToRecurring
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
            recurringPattern={recurringPattern}
            setRecurringPattern={setRecurringPattern}
            reminderHours={reminderHours}
            setReminderHours={setReminderHours}
          />
        );
        
      case 'inactivity_to_date':
        return (
          <InactivityToDate
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
            minutesThreshold={minutesThreshold}
            setMinutesThreshold={setMinutesThreshold}
            triggerDate={triggerDate}
            setTriggerDate={setTriggerDate}
            recurringPattern={recurringPattern}
            setRecurringPattern={setRecurringPattern}
            reminderHours={reminderHours}
            setReminderHours={setReminderHours}
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <ConditionTypeSelector
        conditionType={conditionType}
        setConditionType={(type) => {
          setConditionType(type);
          
          // If switching to panic trigger, initialize the config if needed
          if (type === 'panic_trigger' && !panicTriggerConfig) {
            setPanicTriggerConfig(defaultPanicConfig);
          }
        }}
      />
      
      {renderConditionOptions()}
    </div>
  );
}
