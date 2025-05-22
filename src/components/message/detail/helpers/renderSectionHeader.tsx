
import React from "react";

export function renderSectionHeader(icon: React.ReactNode, title: string) {
  return (
    <div className="flex items-center mb-2">
      <div className="mr-2">{icon}</div>
      <h2 className="text-xl font-medium">{title}</h2>
    </div>
  );
}
