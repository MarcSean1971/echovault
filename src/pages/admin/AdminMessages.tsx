
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { mockMessages } from "@/data/mockMessages";
import { MessageMobileCard } from "@/components/admin/messages/MessageMobileCard";
import { MessageTable } from "@/components/admin/messages/MessageTable";
import { MessagesFilter } from "@/components/admin/messages/MessagesFilter";
import { MessagesHeader } from "@/components/admin/messages/MessagesHeader";
import { MessagesCardHeader } from "@/components/admin/messages/MessagesCardHeader";

export default function AdminMessages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const isMobile = useIsMobile();
  
  // Filter messages based on search query and status filter
  const filteredMessages = mockMessages.filter(message => {
    const matchesSearch = 
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      message.sender.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      message.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <MessagesHeader 
          title="Message Management" 
          description="View and manage user messages" 
        />
        
        <MessagesFilter
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <MessagesCardHeader 
              messageCount={filteredMessages.length}
              isMobile={isMobile}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Mobile message cards
            <div className="space-y-4">
              {filteredMessages.map(message => (
                <MessageMobileCard key={message.id} message={message} />
              ))}
            </div>
          ) : (
            // Desktop table
            <MessageTable messages={filteredMessages} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
