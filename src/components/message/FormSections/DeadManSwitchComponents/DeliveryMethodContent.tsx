
import { TriggerType, DeliveryOption, RecurringPattern, PanicTriggerConfig } from "@/types/message";
import { ConditionTypeSelector } from "./ConditionTypeSelector";
import { CheckInCodeInput } from "./CheckInCodeInput";
import { NoCheckInCondition } from "./conditions/NoCheckInCondition";
import { RegularCheckInCondition } from "./conditions/RegularCheckInCondition";
import { GroupConfirmationCondition } from "./conditions/GroupConfirmationCondition";
import { PanicTriggerCondition } from "./conditions/PanicTriggerCondition";
import { InactivityToRecurringCondition } from "./conditions/InactivityToRecurringCondition";
import { InactivityToDateCondition } from "./conditions/InactivityToDateCondition";

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

  // Render the custom check-in code input
  const renderCustomCheckInCode = () => {
    // Only show for check-in related condition types
    if (conditionType !== 'no_check_in' && conditionType !== 'regular_check_in') return null;
    
    return <CheckInCodeInput checkInCode={checkInCode} setCheckInCode={setCheckInCode} />;
  };
  
  // Render different options based on selected condition type
  const renderConditionOptions = () => {
    switch (conditionType) {
      case 'no_check_in':
        return (
          <NoCheckInCondition
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
            minutesThreshold={minutesThreshold}
            setMinutesThreshold={setMinutesThreshold}
            deliveryOption={deliveryOption}
            setDeliveryOption={setDeliveryOption}
            recurringPattern={recurringPattern}
            setRecurringPattern={setRecurringPattern}
            triggerDate={triggerDate}
            setTriggerDate={setTriggerDate}
            reminderHours={reminderHours}
            setReminderHours={setReminderHours}
            renderCustomCheckInCode={renderCustomCheckInCode}
          />
        );
        
      case 'regular_check_in':
        return (
          <RegularCheckInCondition
            conditionType={conditionType}
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
            renderCustomCheckInCode={renderCustomCheckInCode}
          />
        );
        
      case 'group_confirmation':
        return <GroupConfirmationCondition />;
        
      case 'panic_trigger':
        return (
          <PanicTriggerCondition
            config={panicTriggerConfig || defaultPanicConfig}
            setConfig={handlePanicConfigUpdate}
          />
        );
        
      case 'inactivity_to_recurring':
        return (
          <InactivityToRecurringCondition
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
            minutesThreshold={minutesThreshold}
            setMinutesThreshold={setMinutesThreshold}
            recurringPattern={recurringPattern}
            setRecurringPattern={setRecurringPattern}
            reminderHours={reminderHours}
            setReminderHours={setReminderHours}
          />
        );
        
      case 'inactivity_to_date':
        return (
          <InactivityToDateCondition
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
