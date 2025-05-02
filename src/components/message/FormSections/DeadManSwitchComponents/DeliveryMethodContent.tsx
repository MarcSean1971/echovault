
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
  setActiveTab
}: DeliveryMethodContentProps) {
  
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
            <NoCheckInDeliveryOptions
              deliveryOption={deliveryOption}
              setDeliveryOption={setDeliveryOption}
              recurringPattern={recurringPattern}
              setRecurringPattern={setRecurringPattern}
              triggerDate={triggerDate}
              setTriggerDate={setTriggerDate}
            />
            <ReminderSettings
              reminderHours={reminderHours}
              setReminderHours={setReminderHours}
            />
          </div>
        );
        
      case 'regular_check_in':
        return (
          <TimeThresholdSelector
            conditionType={conditionType}
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
          />
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
            config={panicTriggerConfig || {
              enabled: true,
              methods: ['app'],
              cancel_window_seconds: 10,
              bypass_logging: false
            }}
            setConfig={setPanicTriggerConfig}
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
        setConditionType={setConditionType}
      />
      
      {renderConditionOptions()}
    </div>
  );
}
