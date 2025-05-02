
import { useState } from "react";
import { useMessageForm } from "../MessageFormContext";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryMethodContent } from "./DeadManSwitchComponents/DeliveryMethodContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import { SwitchToggle } from "./DeadManSwitchComponents/SwitchToggle";
import { SecurityOptions } from "./DeadManSwitchComponents/SecurityOptions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeadManSwitchProps {
  setActiveTab: (tab: string) => void;
}

export function DeadManSwitch({ setActiveTab }: DeadManSwitchProps) {
  const { 
    enableDeadManSwitch,
    setEnableDeadManSwitch,
    conditionType,
    setConditionType,
    hoursThreshold,
    setHoursThreshold,
    minutesThreshold, 
    setMinutesThreshold,
    recurringPattern,
    setRecurringPattern,
    triggerDate,
    setTriggerDate,
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
  const { userId } = useAuth();
  const [securityTab, setSecurityTab] = useState<string>("delivery");

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-amber-500 mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-medium">Authentication Required</h3>
          </div>
          <p>You must be logged in to configure delivery triggers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SwitchToggle 
        enableDeadManSwitch={enableDeadManSwitch}
        setEnableDeadManSwitch={setEnableDeadManSwitch}
        showLabel={true}
      />

      {enableDeadManSwitch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Trigger Configuration
            </CardTitle>
            <CardDescription>
              Configure when and how your message will be delivered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={securityTab} onValueChange={setSecurityTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="delivery">Delivery Method</TabsTrigger>
                <TabsTrigger value="security">Security Options</TabsTrigger>
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
              
              <TabsContent value="security">
                <SecurityOptions
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
      )}
    </div>
  );
}
