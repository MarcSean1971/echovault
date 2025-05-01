
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Recipient } from "@/types/message";
import { fetchRecipients } from "@/services/messageService";

interface DeadManSwitchProps {
  enableDeadManSwitch: boolean;
  setEnableDeadManSwitch: (enable: boolean) => void;
  conditionType: 'no_check_in' | 'regular_check_in';
  setConditionType: (type: 'no_check_in' | 'regular_check_in') => void;
  hoursThreshold: number;
  setHoursThreshold: (hours: number) => void;
  selectedRecipients: string[];
  setSelectedRecipients: (recipients: string[]) => void;
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
  const navigate = useNavigate();
  const [showRecipientsSheet, setShowRecipientsSheet] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // Fetch recipients on component mount
  useEffect(() => {
    if (userId) {
      const loadRecipients = async () => {
        try {
          const data = await fetchRecipients();
          setRecipients(data);
        } catch (error) {
          console.error("Error fetching recipients:", error);
        }
      };
      
      loadRecipients();
    }
  }, [userId]);

  const toggleRecipientSelection = (recipientId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Dead Man's Switch</h3>
          <p className="text-sm text-muted-foreground">
            Release this message to trusted recipients if you don't check in
          </p>
        </div>
        <Switch
          checked={enableDeadManSwitch}
          onCheckedChange={setEnableDeadManSwitch}
          id="dead-man-switch"
        />
      </div>

      {enableDeadManSwitch && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="condition-type">Release Condition</Label>
            <Select
              value={conditionType}
              onValueChange={(value: 'no_check_in' | 'regular_check_in') => setConditionType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_check_in">If I don't check in</SelectItem>
                <SelectItem value="regular_check_in">If I miss a regular check-in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours-threshold">Time Threshold (hours)</Label>
            <Input
              id="hours-threshold"
              type="number"
              min={1}
              max={8760} // 1 year in hours
              value={hoursThreshold}
              onChange={(e) => setHoursThreshold(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              {conditionType === 'no_check_in' 
                ? "Message will be released if you don't check in within this time period"
                : "Message will be released if you miss your regular check-in by this amount of time"}
            </p>
          </div>

          <RecipientsSelector 
            recipients={recipients} 
            selectedRecipients={selectedRecipients} 
            toggleRecipientSelection={toggleRecipientSelection}
            showRecipientsSheet={showRecipientsSheet}
            setShowRecipientsSheet={setShowRecipientsSheet}
            navigate={navigate}
          />
        </div>
      )}
    </div>
  );
}

interface RecipientsSelectorProps {
  recipients: Recipient[];
  selectedRecipients: string[];
  toggleRecipientSelection: (id: string) => void;
  showRecipientsSheet: boolean;
  setShowRecipientsSheet: (show: boolean) => void;
  navigate: (path: string) => void;
}

function RecipientsSelector({
  recipients,
  selectedRecipients,
  toggleRecipientSelection,
  showRecipientsSheet,
  setShowRecipientsSheet,
  navigate
}: RecipientsSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Select Recipients</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/recipients')}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Recipient
        </Button>
      </div>
      
      <Sheet open={showRecipientsSheet} onOpenChange={setShowRecipientsSheet}>
        <SheetTrigger asChild>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full justify-between"
          >
            {selectedRecipients.length 
              ? `${selectedRecipients.length} recipient(s) selected` 
              : "Select recipients"}
            <span className="sr-only">Select recipients</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Select Recipients</SheetTitle>
            <SheetDescription>
              Choose who should receive this message if the dead man's switch is triggered
            </SheetDescription>
          </SheetHeader>
          
          <div className="my-6 space-y-4">
            {recipients.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recipients added yet.</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    setShowRecipientsSheet(false);
                    navigate('/recipients');
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Recipient
                </Button>
              </div>
            ) : (
              recipients.map(recipient => (
                <div key={recipient.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`recipient-${recipient.id}`} 
                    checked={selectedRecipients.includes(recipient.id)}
                    onCheckedChange={() => toggleRecipientSelection(recipient.id)}
                  />
                  <Label 
                    htmlFor={`recipient-${recipient.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-sm text-muted-foreground">{recipient.email}</div>
                  </Label>
                </div>
              ))
            )}
          </div>
          
          <SheetFooter>
            <Button 
              type="button" 
              onClick={() => setShowRecipientsSheet(false)}
            >
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {selectedRecipients.length === 0 && (
        <p className="text-sm text-red-500">
          You must select at least one recipient
        </p>
      )}
    </div>
  );
}
