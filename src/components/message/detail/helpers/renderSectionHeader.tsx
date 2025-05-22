
import React from "react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function renderSectionHeader(icon: React.ReactNode, title: string) {
  return (
    <div className="flex items-center mb-4">
      <div className="mr-2">{icon}</div>
      <h2 className="text-xl font-medium text-purple-900">{title}</h2>
    </div>
  );
}
