
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIEnhancer } from "@/components/AIEnhancer";
import { MessageTypeUnavailable } from "../MessageTypeUnavailable";
import { FileUploader, FileAttachment } from "@/components/FileUploader";

interface MessageDetailsProps {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  messageType: string;
  setMessageType: (messageType: string) => void;
  files: FileAttachment[];
  setFiles: (files: FileAttachment[]) => void;
  isLoading: boolean;
}

export function MessageDetails({
  title,
  setTitle,
  content,
  setContent,
  messageType,
  setMessageType,
  files,
  setFiles,
  isLoading,
}: MessageDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Message Title</Label>
        <Input
          id="title"
          placeholder="Enter a title for this message"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Message Type</Label>
        <Select
          value={messageType}
          onValueChange={setMessageType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select message type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Note</SelectItem>
            <SelectItem value="voice">Voice Message</SelectItem>
            <SelectItem value="video">Video Message</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {messageType === "text" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Message Content</Label>
            <AIEnhancer content={content} onChange={setContent} />
          </div>
          <Textarea
            id="content"
            placeholder="Write your message here..."
            className="min-h-[200px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
      )}

      {messageType === "voice" && (
        <MessageTypeUnavailable type="Voice recording" />
      )}

      {messageType === "video" && (
        <MessageTypeUnavailable type="Video recording" />
      )}

      <div className="space-y-2">
        <Label>Attachments (Optional)</Label>
        <FileUploader
          files={files}
          onChange={setFiles}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
