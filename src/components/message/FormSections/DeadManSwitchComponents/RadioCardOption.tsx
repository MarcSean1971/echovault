
import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface RadioCardOptionProps {
  value: string;
  id: string;
  label: string;
  description: string;
  icon?: ReactNode;
  isSelected?: boolean;
}

export function RadioCardOption({
  value,
  id,
  label,
  description,
  icon,
  isSelected
}: RadioCardOptionProps) {
  return (
    <div className={cn(
      "flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors",
      isSelected && "border-primary bg-primary/5"
    )}>
      <RadioGroupItem value={value} id={id} className="mt-1" />
      <div className="space-y-1">
        <div className="flex items-center">
          <Label htmlFor={id} className="font-medium cursor-pointer">{label}</Label>
          {icon && <span className="ml-2 text-muted-foreground">{icon}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
