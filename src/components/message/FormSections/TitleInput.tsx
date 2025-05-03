
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export function TitleInput() {
  const { title, setTitle } = useMessageForm();

  return (
    <div className="space-y-2">
      <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`w-full p-2 border rounded-md ${HOVER_TRANSITION} focus:ring-2 focus:ring-primary/20 focus:border-primary`}
        placeholder="Enter a title for your message"
      />
    </div>
  );
}
