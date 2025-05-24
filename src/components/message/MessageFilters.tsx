
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface MessageFiltersProps {
  statusFilter: "all" | "armed" | "disarmed";
  onStatusFilterChange: (value: "all" | "armed" | "disarmed") => void;
  typeFilter: "all" | "no_check_in" | "scheduled" | "panic_trigger";
  onTypeFilterChange: (value: "all" | "no_check_in" | "scheduled" | "panic_trigger") => void;
}

export function MessageFilters({
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange
}: MessageFiltersProps) {
  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="armed">Armed</SelectItem>
              <SelectItem value="disarmed">Disarmed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Type</label>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="no_check_in">Check-in Required</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="panic_trigger">Panic Button</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
