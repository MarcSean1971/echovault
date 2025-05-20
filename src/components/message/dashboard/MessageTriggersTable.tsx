
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageCondition, Message } from "@/types/message";
import { MessageConditionRow } from "./MessageConditionRow";
import { Loader2, RefreshCw } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageTriggersTableProps {
  conditions: MessageCondition[];
  messages: Message[];
  isLoading: boolean;
  userId?: string;
  onRefreshConditions: () => void;
}

export function MessageTriggersTable({
  conditions,
  messages,
  isLoading,
  userId,
  onRefreshConditions
}: MessageTriggersTableProps) {
  const navigate = useNavigate();
  
  return (
    <Card className={HOVER_TRANSITION}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Message Triggers</CardTitle>
          <CardDescription>
            Manage all your message triggers and their delivery conditions
          </CardDescription>
        </div>
        {conditions.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            className={`ml-auto ${HOVER_TRANSITION}`}
            onClick={onRefreshConditions}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className={`h-4 w-4 ${HOVER_TRANSITION}`} />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <Loader2 className={`h-6 w-6 animate-spin mx-auto mb-2 ${HOVER_TRANSITION}`} />
            <p className="text-muted-foreground">Loading message triggers...</p>
          </div>
        ) : conditions.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No message triggers set up yet</p>
            <Button 
              variant="outline" 
              className={`mt-2 ${HOVER_TRANSITION}`}
              onClick={() => navigate("/create-message")}
            >
              Create Your First Message
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conditions.map(condition => {
                  // Find matching message
                  const message = messages.find(m => m.id === condition.message_id);
                  
                  return (
                    <MessageConditionRow 
                      key={condition.id}
                      condition={condition}
                      message={message}
                      userId={userId}
                      onRefreshConditions={onRefreshConditions}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
