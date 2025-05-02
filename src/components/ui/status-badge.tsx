
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, BellOff, Bell, Clock, Shield, CheckCircle } from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5",
  {
    variants: {
      variant: {
        default: "",
        outline: "border bg-background",
      },
      status: {
        armed: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
        disarmed: "bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20",
        pending: "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20",
        critical: "bg-destructive/20 text-destructive border-destructive animate-pulse",
        warning: "bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/20",
        success: "bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20",
        info: "bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/20",
        neutral: "bg-muted text-muted-foreground border-muted-foreground/30",
      },
      size: {
        sm: "text-xs px-2 py-0.5 rounded-full",
        default: "text-xs px-2.5 py-0.5 rounded-full",
        lg: "text-sm px-3 py-1 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      status: "neutral",
      size: "default",
    },
  }
);

export interface StatusBadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  showIcon?: boolean;
  iconOnly?: boolean;
  pulseAnimation?: boolean;
}

const statusIcons = {
  armed: Bell,
  disarmed: BellOff,
  pending: Clock,
  critical: AlertCircle,
  warning: AlertCircle,
  success: CheckCircle,
  info: Shield,
  neutral: Clock,
};

export function StatusBadge({
  className,
  variant,
  status = "neutral",
  size,
  showIcon = true,
  iconOnly = false,
  pulseAnimation = false,
  children,
  ...props
}: StatusBadgeProps) {
  const Icon = status && statusIcons[status as keyof typeof statusIcons];
  
  return (
    <Badge 
      className={cn(
        statusBadgeVariants({ variant, status, size }),
        pulseAnimation && "animate-pulse",
        className
      )} 
      {...props}
    >
      {showIcon && Icon && <Icon className="h-3.5 w-3.5" />}
      {!iconOnly && children}
    </Badge>
  );
}
