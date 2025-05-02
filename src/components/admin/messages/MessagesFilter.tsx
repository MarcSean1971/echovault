
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MessagesFilterProps {
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  statusFilter: string;
}

export function MessagesFilter({
  onSearchChange,
  onStatusChange,
  searchQuery,
  statusFilter
}: MessagesFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
      <div className="relative w-full md:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          className="pl-9 w-full md:w-[250px]"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusChange}>
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
  );
}
