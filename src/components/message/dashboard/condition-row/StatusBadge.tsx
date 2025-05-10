
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "disarmed" | "armed" | "triggered" | "delivered";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "disarmed":
      return (
        <Badge variant="outline" className="bg-muted">
          <Shield className="h-3 w-3 mr-1" />
          Disarmed
        </Badge>
      );
    case "armed":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <ShieldAlert className="h-3 w-3 mr-1" />
          Armed
        </Badge>
      );
    case "triggered":
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Triggered
        </Badge>
      );
    case "delivered":
      return (
        <Badge variant="default">
          <CheckCircle className="h-3 w-3 mr-1" />
          Delivered
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      );
  }
}
