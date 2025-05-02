
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info, Users } from "lucide-react";

interface MessageDetailsSheetProps {
  showDetailsSheet: boolean;
  setShowDetailsSheet: (show: boolean) => void;
  formatDate: (dateString: string) => string;
  message: any;
  renderRecipients: () => React.ReactNode;
  renderConditionType: () => string;
  isArmed: boolean;
  conditionId: string | null;
  isActionLoading: boolean;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
}

export function MessageDetailsSheet({
  showDetailsSheet,
  setShowDetailsSheet,
  formatDate,
  message,
  renderRecipients,
  renderConditionType,
  isArmed,
  conditionId,
  isActionLoading,
  handleDisarmMessage,
  handleArmMessage
}: MessageDetailsSheetProps) {
  return (
    <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
      <SheetContent side="bottom" className="h-[80vh] max-h-[80vh] overflow-auto">
        <SheetHeader className="text-left pb-0">
          <SheetTitle>Message Details</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Status card */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-md font-medium">Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isArmed ? 'bg-destructive' : 'bg-green-500'}`}></div>
                <span className={`text-xs ${isArmed ? 'text-destructive' : 'text-green-600'}`}>
                  {isArmed ? 'Armed' : 'Disarmed'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium mr-1">Created:</span> 
                {formatDate(message.created_at)}
              </div>
              
              <div className="flex items-center text-sm">
                <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium mr-1">Type:</span>
                {renderConditionType()}
              </div>
            </div>
          </div>
          
          <div className="h-px bg-border w-full"></div>
          
          {/* Recipients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">Recipients</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            {renderRecipients()}
          </div>
          
          <div className="h-px bg-border w-full"></div>
          
          {/* Arm/Disarm action */}
          {conditionId && (
            <div className="pt-2">
              {isArmed ? (
                <Button
                  variant="outline"
                  onClick={handleDisarmMessage}
                  disabled={isActionLoading}
                  className="w-full text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10M10 2h4a2 2 0 0 1 2 2v4H8V4a2 2 0 0 1 2-2Z"></path></svg>
                  Disarm Message
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleArmMessage}
                  disabled={isActionLoading}
                  className="w-full text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/80"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10M10 2h4a2 2 0 0 1 2 2v4H8V4a2 2 0 0 1 2-2Z"></path></svg>
                  Arm Message
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
