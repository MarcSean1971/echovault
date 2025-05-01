
import { ConditionTypeSelector } from "./ConditionTypeSelector";
import { TimeThresholdSelector } from "./TimeThresholdSelector";
import { ScheduledDateSection } from "./ScheduledDateSection";
import { PanicTrigger } from "./PanicTrigger";
import { NoCheckInDeliveryOptions } from "./NoCheckInDeliveryOptions";
import { RecurringPatternSelector } from "./RecurringPatternSelector";
import { ReminderSettings } from "./ReminderSettings";
import { InactivityToDate } from "./InactivityToDate";
import { TriggerType } from "@/types/message";

interface DeliveryMethodContentProps {
  conditionType: TriggerType;
  setConditionType: (value: TriggerType) => void;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  minutesThreshold: number;
  setMinutesThreshold: (value: number) => void;
  deliveryOption: string;
  setDeliveryOption: (value: any) => void;
  recurringPattern: any;
  setRecurringPattern: (value: any) => void;
  triggerDate: Date | undefined;
  setTriggerDate: (value: Date | undefined) => void;
  panicTriggerConfig: any;
  setPanicTriggerConfig: (value: any) => void;
  reminderHours: number[];
  setReminderHours: (value: number[]) => void;
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
  return (
    <div className="space-y-6">
      <ConditionTypeSelector
        conditionType={conditionType}
        setConditionType={setConditionType}
      />

      {conditionType === 'no_check_in' && (
        <>
          <TimeThresholdSelector
            conditionType={conditionType}
            hoursThreshold={hoursThreshold}
            setHoursThreshold={setHoursThreshold}
            minutesThreshold={minutesThreshold}
            setMinutesThreshold={setMinutesThreshold}
          />
          
          <NoCheckInDeliveryOptions
            deliveryOption={deliveryOption}
            setDeliveryOption={setDeliveryOption}
          />
          
          {deliveryOption === "recurring" && (
            <div className="mt-4 pl-4 border-l-2 border-muted">
              <RecurringPatternSelector
                pattern={recurringPattern}
                setPattern={setRecurringPattern}
                forceEnabled={true}
              />
            </div>
          )}
          
          {deliveryOption === "specific_date" && (
            <div className="mt-4 pl-4 border-l-2 border-muted">
              <ScheduledDateSection
                triggerDate={triggerDate}
                setTriggerDate={setTriggerDate}
                recurringPattern={recurringPattern}
                setRecurringPattern={setRecurringPattern}
              />
            </div>
          )}
          
          <ReminderSettings
            reminderHours={reminderHours}
            setReminderHours={setReminderHours}
            maxHours={hoursThreshold + (minutesThreshold / 60)}
          />
        </>
      )}
      
      {conditionType === 'scheduled_date' && (
        <ScheduledDateSection
          triggerDate={triggerDate}
          setTriggerDate={setTriggerDate}
          recurringPattern={recurringPattern}
          setRecurringPattern={setRecurringPattern}
        />
      )}
      
      {conditionType === 'inactivity_to_date' && (
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
      )}
      
      {conditionType === 'panic_trigger' && (
        <PanicTrigger 
          config={panicTriggerConfig}
          setConfig={setPanicTriggerConfig}
        />
      )}
      
      <div className="pt-4 flex justify-end">
        <button 
          type="button"
          onClick={() => setActiveTab("recipients")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Next: Choose Recipients
        </button>
      </div>
    </div>
  );
}
