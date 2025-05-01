
import { useState, useEffect } from "react";
import { fetchRecipients } from "@/services/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipientsSelector } from "./RecipientsSelector";
import { Recipient } from "@/types/message";

interface DeadManSwitchProps {
  enableDeadManSwitch: boolean;
  setEnableDeadManSwitch: (value: boolean) => void;
  conditionType: 'no_check_in' | 'regular_check_in';
  setConditionType: (value: 'no_check_in' | 'regular_check_in') => void;
  hoursThreshold: number;
  setHoursThreshold: (value: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (value: string[]) => void;
  userId: string | null;
}

export function DeadManSwitch({
  enableDeadManSwitch,
  setEnableDeadManSwitch,
  conditionType,
  setConditionType,
  hoursThreshold,
  setHoursThreshold,
  selectedRecipients,
  setSelectedRecipients,
  userId
}: DeadManSwitchProps) {
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

  // Fixed: the error was that we were updating a non-array with an array function
  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipients((prev: string[]) => {
      if (prev.includes(recipientId)) {
        return prev.filter(id => id !== recipientId);
      } else {
        return [...prev, recipientId];
      }
    });
  };

  if (!enableDeadManSwitch) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="dead-man-switch"
              checked={enableDeadManSwitch}
              onCheckedChange={setEnableDeadManSwitch}
            />
            <Label htmlFor="dead-man-switch">
              Enable dead man's switch
            </Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="dead-man-switch" className="font-medium text-lg">
            Dead Man's Switch
          </Label>
          <Switch
            id="dead-man-switch"
            checked={enableDeadManSwitch}
            onCheckedChange={setEnableDeadManSwitch}
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Condition Type</Label>
            <RadioGroup 
              value={conditionType}
              onValueChange={(value) => setConditionType(value as 'no_check_in' | 'regular_check_in')}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_check_in" id="no-check-in" />
                <Label htmlFor="no-check-in">Send if I don't check in</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="regular_check_in" id="regular-check-in" />
                <Label htmlFor="regular-check-in">Send on a regular schedule</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="hours-threshold" className="mb-2 block">
              {conditionType === 'no_check_in' 
                ? 'Hours without check-in before sending' 
                : 'Send every X hours'}
            </Label>
            <Select 
              value={hoursThreshold.toString()} 
              onValueChange={(value) => setHoursThreshold(Number(value))}
            >
              <SelectTrigger id="hours-threshold">
                <SelectValue placeholder="Select hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 hours (1 day)</SelectItem>
                <SelectItem value="48">48 hours (2 days)</SelectItem>
                <SelectItem value="72">72 hours (3 days)</SelectItem>
                <SelectItem value="168">168 hours (1 week)</SelectItem>
                <SelectItem value="336">336 hours (2 weeks)</SelectItem>
                <SelectItem value="720">720 hours (30 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <RecipientsSelector
            recipients={recipients}
            selectedRecipients={selectedRecipients}
            onSelectRecipient={handleRecipientSelect}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
