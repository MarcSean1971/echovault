
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Recipient } from "@/types/message";
import { SwitchToggle } from "./DeadManSwitchComponents/SwitchToggle";
import { ConditionTypeSelector } from "./DeadManSwitchComponents/ConditionTypeSelector";
import { TimeThresholdSelector } from "./DeadManSwitchComponents/TimeThresholdSelector";
import { RecipientsSelector } from "./RecipientsSelector";
import { ScheduledDateSection } from "./DeadManSwitchComponents/ScheduledDateSection";
import { PanicTrigger } from "./DeadManSwitchComponents/PanicTrigger";
import { SecurityOptions } from "./DeadManSwitchComponents/SecurityOptions";
import { useMessageForm } from "../MessageFormContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NoCheckInDeliveryOptions } from "./DeadManSwitchComponents/NoCheckInDeliveryOptions";
import { RecurringPatternSelector } from "./DeadManSwitchComponents/RecurringPatternSelector";
import { ReminderSettings } from "./DeadManSwitchComponents/ReminderSettings";
import { InactivityToDate } from "./DeadManSwitchComponents/InactivityToDate";

export function DeadManSwitch() {
  const { userId } = useAuth();
  const {
    enableDeadManSwitch,
    setEnableDeadManSwitch,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold,
    setMinutesThreshold,
    selectedRecipients,
    setSelectedRecipients,
    triggerDate,
    setTriggerDate,
    recurringPattern,
    setRecurringPattern,
    panicTriggerConfig,
    setPanicTriggerConfig,
    pinCode,
    setPinCode,
    unlockDelay,
    setUnlockDelay,
    expiryHours,
    setExpiryHours,
    deliveryOption,
    setDeliveryOption,
    reminderHours,
    setReminderHours
  } = useMessageForm();

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("delivery");
  
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="delivery">1. Delivery Method</TabsTrigger>
            <TabsTrigger value="recipients">2. Recipients</TabsTrigger>
            <TabsTrigger value="security">3. Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="delivery" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="recipients" className="space-y-6">
            <RecipientsSelector
              recipients={recipients}
              selectedRecipients={selectedRecipients}
              onSelectRecipient={handleRecipientSelect}
              isLoading={isLoading}
            />
            
            <div className="pt-4 flex justify-between">
              <button 
                type="button"
                onClick={() => setActiveTab("delivery")}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              >
                Back to Delivery Method
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab("security")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Next: Security Options
              </button>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <SecurityOptions
              pinCode={pinCode}
              setPinCode={setPinCode}
              unlockDelay={unlockDelay}
              setUnlockDelay={setUnlockDelay}
              expiryHours={expiryHours}
              setExpiryHours={setExpiryHours}
            />
            
            <div className="pt-4 flex justify-start">
              <button 
                type="button"
                onClick={() => setActiveTab("recipients")}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              >
                Back to Recipients
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
