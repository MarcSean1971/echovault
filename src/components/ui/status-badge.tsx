
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        armed: "bg-destructive/15 text-destructive hover:bg-destructive/20",
        disarmed: "bg-green-100 text-green-700 hover:bg-green-200",
        pending: "bg-amber-100 text-amber-700 hover:bg-amber-200",
        panic: "bg-red-100 text-red-700 hover:bg-red-200",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
        lg: "px-3 py-1",
      },
    },
    defaultVariants: {
      status: "armed",
      size: "md",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({ className, status, size, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ status, size }), className)} {...props} />
  );
}
