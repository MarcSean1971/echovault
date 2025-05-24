
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MessageCard } from "@/components/message/MessageCard";
import { useMessageList } from "@/hooks/useMessageList";
import { Skeleton } from "@/components/ui/skeleton";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EmergencyReminderFix } from '@/components/emergency/EmergencyReminderFix';

export default function Messages() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<"panic" | "regular" | "all">("all");
  
  const { 
    messages, 
    panicMessages, 
    regularMessages, 
    isLoading,
    reminderRefreshTrigger,
    forceRefresh
  } = useMessageList();

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId, navigate]);

  const filteredMessages = React.useMemo(() => {
    let filtered = messages;
    
    if (filterType === "panic") {
      filtered = panicMessages;
    } else if (filterType === "regular") {
      filtered = regularMessages;
    }
    
    return filtered.filter((message) =>
      message.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [messages, search, filterType, panicMessages, regularMessages]);

  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Emergency Fix Component - Show at top for immediate access */}
      <div className="mb-6">
        <EmergencyReminderFix />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Your Messages</h1>
        <Button onClick={() => navigate("/create-message")}><PlusCircle className="mr-2 h-4 w-4" /> Create New</Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Search and Filter */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center space-x-4">
          <div className="relative w-full max-w-sm">
            <Input
              type="search"
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white"
            />
          </div>
          
          <Command className="relative">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isFilterOpen}
              aria-label="Filter messages"
              className="justify-between w-[200px]"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              Filter by Type
            </Button>
            
            <CommandList className="absolute top-11 left-0 z-50 min-w-[200px] overflow-visible">
              <CommandInput placeholder="Search types..." />
              <CommandEmpty>No types found.</CommandEmpty>
              <CommandGroup heading="Type">
                <CommandItem onSelect={() => {
                  setFilterType("all");
                  setIsFilterOpen(false);
                }}>
                  All
                </CommandItem>
                <CommandItem onSelect={() => {
                  setFilterType("regular");
                  setIsFilterOpen(false);
                }}>
                  Regular
                </CommandItem>
                <CommandItem onSelect={() => {
                  setFilterType("panic");
                  setIsFilterOpen(false);
                }}>
                  Panic
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
          
          <Button variant="secondary" onClick={forceRefresh}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <>
            <Skeleton className="w-full h-48" />
            <Skeleton className="w-full h-48" />
            <Skeleton className="w-full h-48" />
          </>
        ) : filteredMessages.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center">
            <p className="text-muted-foreground">No messages found.</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              reminderRefreshCounter={reminderRefreshTrigger}
            />
          ))
        )}
      </div>
    </div>
  );
}
