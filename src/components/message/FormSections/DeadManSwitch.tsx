
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Recipient } from "@/types/message";
import { SwitchToggle } from "./DeadManSwitchComponents/SwitchToggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMessageForm } from "../MessageFormContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryMethodContent } from "./DeadManSwitchComponents/DeliveryMethodContent";
import { RecipientsContent } from "./DeadManSwitchComponents/RecipientsContent";
import { SecurityContent } from "./DeadManSwitchComponents/SecurityContent";

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
          
          <TabsContent value="delivery">
            <DeliveryMethodContent 
              conditionType={conditionType}
              setConditionType={setConditionType}
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
              panicTriggerConfig={panicTriggerConfig}
              setPanicTriggerConfig={setPanicTriggerConfig}
              reminderHours={reminderHours}
              setReminderHours={setReminderHours}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          
          <TabsContent value="recipients">
            <RecipientsContent 
              recipients={recipients}
              selectedRecipients={selectedRecipients}
              onSelectRecipient={handleRecipientSelect}
              isLoading={isLoading}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          
          <TabsContent value="security">
            <SecurityContent 
              pinCode={pinCode}
              setPinCode={setPinCode}
              unlockDelay={unlockDelay}
              setUnlockDelay={setUnlockDelay}
              expiryHours={expiryHours}
              setExpiryHours={setExpiryHours}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
