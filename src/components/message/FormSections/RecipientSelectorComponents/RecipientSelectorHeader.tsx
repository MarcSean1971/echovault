
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface RecipientSelectorHeaderProps {
  onAddNew: () => void;
}

export function RecipientSelectorHeader({ onAddNew }: RecipientSelectorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">Select Recipients</Label>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddNew}
      >
        <UserPlus className="h-4 w-4 mr-1" /> Add New
      </Button>
    </div>
  );
}
