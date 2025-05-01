
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
    <Card>
      <CardHeader>
        <CardTitle>Your Message Triggers</CardTitle>
        <CardDescription>
          Manage all your message triggers and their delivery conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">Loading message triggers...</div>
        ) : conditions.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No message triggers set up yet</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate("/create-message")}
            >
              Create Your First Message
            </Button>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
