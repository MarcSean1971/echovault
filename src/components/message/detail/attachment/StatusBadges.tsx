
import React from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AccessMethod } from "./types";

interface MethodStatusBadgeProps {
  status: 'success' | 'error' | 'idle';
}

export const MethodStatusBadge: React.FC<MethodStatusBadgeProps> = ({ status }) => {
  if (status === 'success') {
    return (
      <StatusBadge status="success" size="sm" showIcon className="ml-2">
        Success
      </StatusBadge>
    );
  } else if (status === 'error') {
    return (
      <StatusBadge status="warning" size="sm" showIcon className="ml-2">
        Failed
      </StatusBadge>
    );
  }
  return null;
};

interface FallbackBadgeProps {
  lastSuccessMethod: AccessMethod | null;
  currentMethod: AccessMethod;
}

export const FallbackInfoBadge: React.FC<FallbackBadgeProps> = ({ lastSuccessMethod, currentMethod }) => {
  if (lastSuccessMethod && lastSuccessMethod !== currentMethod) {
    return (
      <StatusBadge status="info" size="sm" showIcon className="ml-2">
        Using fallback
      </StatusBadge>
    );
  }
  return null;
};
