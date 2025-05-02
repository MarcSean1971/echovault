
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Archive, ArrowDownUp, Eye, MessageSquare, MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatusBadge } from "@/components/ui/status-badge";

// Mock message data
const mockMessages = [
  {
    id: "msg_1",
    title: "Important Documents",
    sender: "marc.s@seelenbinderconsulting.com",
    recipients: ["family@example.com"],
    status: "Pending",
    condition: "Inactivity",
    createdAt: "May 1, 2025"
  },
  {
    id: "msg_2",
    title: "My Final Wishes",
    sender: "sarah.wilson@example.com",
    recipients: ["lawyer@example.com"],
    status: "Scheduled",
    condition: "Date",
    createdAt: "April 28, 2025"
  },
  {
    id: "msg_3",
    title: "Personal Video Message",
    sender: "john.doe@example.com",
    recipients: ["brother@example.com", "sister@example.com"],
    status: "Delivered",
    condition: "Panic Trigger",
    createdAt: "April 25, 2025"
  },
  {
    id: "msg_4",
    title: "Financial Instructions",
    sender: "emma.johnson@example.com",
    recipients: ["accountant@example.com"],
    status: "Pending",
    condition: "Inactivity",
    createdAt: "April 22, 2025"
  },
  {
    id: "msg_5",
    title: "Personal Journal",
    sender: "michael.brown@example.com",
    recipients: ["spouse@example.com"],
    status: "Draft",
    condition: "None",
    createdAt: "April 20, 2025"
  }
];

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
  
  // Updated getStatusColor function to return only valid Badge variants
  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status.toLowerCase()) {
      case "pending": return "outline";
      case "scheduled": return "secondary";
      case "delivered": return "default";
      case "draft": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Message Management
          </h1>
          <p className="text-muted-foreground">
            View and manage user messages
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-9 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Messages ({filteredMessages.length})</span>
              <Badge variant="outline" className="ml-2">
                <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
                Sort by Date
              </Badge>
            </div>
            <Button size={isMobile ? "sm" : "default"} variant="outline">
              <Archive className="h-4 w-4 mr-2" />
              Archive Selected
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Mobile message cards
            <div className="space-y-4">
              {filteredMessages.map(message => (
                <div key={message.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id={`select-${message.id}`} />
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <StatusBadge status={message.status.toLowerCase() as any}>
                      {message.status}
                    </StatusBadge>
                  </div>
                  
                  <h3 className="font-medium mb-1">{message.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">From: {message.sender}</p>
                  
                  <div className="text-xs mb-3">
                    <span className="text-muted-foreground">To: </span>
                    {message.recipients.join(", ")}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline">{message.condition}</Badge>
                    <span className="text-xs text-muted-foreground">Created: {message.createdAt}</span>
                  </div>
                  
                  <div className="flex justify-end mt-3 gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Message</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map(message => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <Checkbox id={`select-${message.id}`} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{message.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{message.condition}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">{message.sender}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm">
                        {message.recipients.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={message.status.toLowerCase() as any}>
                        {message.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{message.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Message</DropdownMenuItem>
                            <DropdownMenuItem>Archive</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Delete Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
