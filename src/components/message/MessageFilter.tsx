
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MessageFilterProps {
  messageType: string | null;
  onFilterChange: (value: string | null) => void;
}

export function MessageFilter({ messageType, onFilterChange }: MessageFilterProps) {
  return (
    <div className="flex justify-end mb-6">
      <div className="w-full max-w-xs">
        <Select value={messageType || ''} onValueChange={(value) => onFilterChange(value || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Messages</SelectItem>
            <SelectItem value="text">Text Notes</SelectItem>
            <SelectItem value="voice">Voice Messages</SelectItem>
            <SelectItem value="video">Video Messages</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
