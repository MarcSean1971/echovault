
import React from "react";
import { Shield, FileCheck, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AccessMethod } from "./types";
import { getBadgeVariant, getMethodName } from "@/utils/fileUtils";

interface AttachmentBadgeProps {
  method: AccessMethod;
  className?: string;
}

export const AttachmentBadge: React.FC<AttachmentBadgeProps> = ({ method, className = "" }) => {
  return (
    <Badge 
      variant={getBadgeVariant(method) as any} 
      className={`text-xs py-0 h-5 ${className}`}
    >
      {method === 'secure' ? (
        <Shield className="h-3 w-3 mr-1" />
      ) : method === 'signed' ? (
        <FileCheck className="h-3 w-3 mr-1" />
      ) : (
        <Link className="h-3 w-3 mr-1" />
      )}
      {getMethodName(method)}
    </Badge>
  );
};
