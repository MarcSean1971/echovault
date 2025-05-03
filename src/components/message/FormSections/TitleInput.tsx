
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useMessageForm } from "../MessageFormContext";

export function TitleInput() {
  const { title, setTitle } = useMessageForm();

  return (
    <div className="space-y-2">
      <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded-md"
        placeholder="Enter a title for your message"
      />
    </div>
  );
}
