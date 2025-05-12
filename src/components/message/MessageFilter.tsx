
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageFilterProps {
  messageType: string | null;
  onFilterChange: (value: string | null) => void;
}

export function MessageFilter({ messageType, onFilterChange }: MessageFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <div className="w-full max-w-xs">
        <Select value={messageType || 'all'} onValueChange={(value) => onFilterChange(value === 'all' ? null : value)}>
          <SelectTrigger className={`${HOVER_TRANSITION} focus:ring-primary`}>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="text">Text Notes</SelectItem>
            <SelectItem value="voice">Voice Messages</SelectItem>
            <SelectItem value="video">Video Messages</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
