
import React from "react";

export function renderSectionHeader(icon: React.ReactNode, title: string) {
  return (
    <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
      {icon}
      <h2 className="text-lg font-medium">{title}</h2>
    </div>
  );
}
