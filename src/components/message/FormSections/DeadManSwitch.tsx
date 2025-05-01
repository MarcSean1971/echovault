
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Recipient } from "@/types/message";
import { SwitchToggle } from "./DeadManSwitchComponents/SwitchToggle";
import { ConditionTypeSelector } from "./DeadManSwitchComponents/ConditionTypeSelector";
import { TimeThresholdSelector } from "./DeadManSwitchComponents/TimeThresholdSelector";
import { RecipientsSelector } from "./RecipientsSelector";
import { ScheduledDateSection } from "./DeadManSwitchComponents/ScheduledDateSection";
import { GroupConfirmation } from "./DeadManSwitchComponents/GroupConfirmation";
import { PanicTrigger } from "./DeadManSwitchComponents/PanicTrigger";
import { AdvancedOptions } from "./DeadManSwitchComponents/AdvancedOptions";
import { InactivityToRecurring } from "./DeadManSwitchComponents/InactivityToRecurring";
import { InactivityToDate } from "./DeadManSwitchComponents/InactivityToDate";
import { ReminderSettings } from "./DeadManSwitchComponents/ReminderSettings";
import { useMessageForm } from "../MessageFormContext";
import { useAuth } from "@/contexts/AuthContext";

export function DeadManSwitch() {
  const { userId } = useAuth();
  const {
    enableDeadManSwitch,
    setEnableDeadManSwitch,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    selectedRecipients,
    setSelectedRecipients,
    triggerDate,
    setTriggerDate,
    recurringPattern,
    setRecurringPattern,
    secondaryTriggerDate,
    setSecondaryTriggerDate,
    secondaryRecurringPattern,
    setSecondaryRecurringPattern,
    reminderHours,
    setReminderHours,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    expiryHours,
    setExpiryHours,
    confirmationsRequired,
    setConfirmationsRequired
  } = useMessageForm();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch available recipients when component mounts
  useEffect(() => {
    if (!userId || !enableDeadManSwitch) return;

    const loadRecipients = async () => {
      setIsLoading(true);
      try {
        const data = await fetchRecipients();
        setRecipients(data);
      } catch (error) {
        console.error("Error fetching recipients:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRecipients();
  }, [userId, enableDeadManSwitch]);

  // Handle recipient selection
  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipients(
      selectedRecipients.includes(recipientId)
        ? selectedRecipients.filter(id => id !== recipientId)
        : [...selectedRecipients, recipientId]
    );
  };

  if (!enableDeadManSwitch) {
    return <SwitchToggle
      enableDeadManSwitch={enableDeadManSwitch}
      setEnableDeadManSwitch={setEnableDeadManSwitch}
    />;
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <SwitchToggle 
          enableDeadManSwitch={enableDeadManSwitch}
          setEnableDeadManSwitch={setEnableDeadManSwitch}
          showLabel={true}
        />

        <div className="space-y-4">
          <ConditionTypeSelector
            conditionType={conditionType}
            setConditionType={setConditionType}
          />

          {(conditionType === 'no_check_in' || conditionType === 'regular_check_in') && (
            <>
              <TimeThresholdSelector
                conditionType={conditionType}
                hoursThreshold={hoursThreshold}
                setHoursThreshold={setHoursThreshold}
              />
              <ReminderSettings
                reminderHours={reminderHours}
                setReminderHours={setReminderHours}
                maxHours={hoursThreshold}
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
          
          {conditionType === 'group_confirmation' && (
            <GroupConfirmation
              confirmationsRequired={confirmationsRequired}
              setConfirmationsRequired={setConfirmationsRequired}
            />
          )}
          
          {conditionType === 'panic_trigger' && (
            <PanicTrigger 
              config={panicTriggerConfig}
              setConfig={setPanicTriggerConfig}
            />
          )}
          
          {conditionType === 'inactivity_to_recurring' && (
            <InactivityToRecurring
              hoursThreshold={hoursThreshold}
              setHoursThreshold={setHoursThreshold}
              recurringPattern={secondaryRecurringPattern}
              setRecurringPattern={setSecondaryRecurringPattern}
              reminderHours={reminderHours}
              setReminderHours={setReminderHours}
            />
          )}
          
          {conditionType === 'inactivity_to_date' && (
            <InactivityToDate
              hoursThreshold={hoursThreshold}
              setHoursThreshold={setHoursThreshold}
              triggerDate={secondaryTriggerDate}
              setTriggerDate={setSecondaryTriggerDate}
              recurringPattern={secondaryRecurringPattern}
              setRecurringPattern={setSecondaryRecurringPattern}
              reminderHours={reminderHours}
              setReminderHours={setReminderHours}
            />
          )}
          
          <RecipientsSelector
            recipients={recipients}
            selectedRecipients={selectedRecipients}
            onSelectRecipient={handleRecipientSelect}
            isLoading={isLoading}
          />
          
          <AdvancedOptions
            pinCode={pinCode}
            setPinCode={setPinCode}
            unlockDelay={unlockDelay}
            setUnlockDelay={setUnlockDelay}
            expiryHours={expiryHours}
            setExpiryHours={setExpiryHours}
          />
        </div>
      </CardContent>
    </Card>
  );
}
