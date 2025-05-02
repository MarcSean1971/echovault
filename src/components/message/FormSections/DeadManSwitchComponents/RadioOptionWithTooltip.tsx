
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

interface RadioOptionWithTooltipProps {
  value: string;
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tooltipText: string;
}

export function RadioOptionWithTooltip({
  value,
  id,
  label,
  description,
  icon: Icon,
  tooltipText
}: RadioOptionWithTooltipProps) {
  return (
    <div className="flex items-start space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors">
      <RadioGroupItem value={value} id={id} className="mt-1" />
      <div className="space-y-1">
        <div className="flex items-center">
          <Label htmlFor={id} className="font-medium cursor-pointer">{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Icon className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[220px]">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
