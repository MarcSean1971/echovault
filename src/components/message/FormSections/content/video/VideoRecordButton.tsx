
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoRecordButtonProps {
  isRecording: boolean;
  isInitializing?: boolean;
  onStartRecording: () => Promise<boolean | void>;
  onStopRecording: () => void;
  className?: string;
}

export function VideoRecordButton({
  isRecording,
  isInitializing = false,
  onStartRecording,
  onStopRecording,
  className
}: VideoRecordButtonProps) {
  const handleClick = () => {
    if (isRecording) {
      onStopRecording();
    } else if (!isInitializing) {
      onStartRecording();
    }
  };
  
  // Determine button style based on recording state
  let buttonVariant = "outline";
  let buttonColor = "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 hover:text-zinc-900";
  let icon = <Mic className="w-6 h-6" />;
  let buttonText = "Record";
  let spinnerClass = "";
  
  // Set styles based on recording state
  if (isRecording) {
    buttonVariant = "destructive";
    buttonColor = "hover:bg-red-700 hover:text-white"; // Added hover effect
    icon = <StopCircle className="w-6 h-6" />;
    buttonText = "Stop";
  } else if (isInitializing) {
    buttonVariant = "outline";
    buttonColor = "opacity-70 cursor-not-allowed";
    spinnerClass = "animate-spin";
  }
  
  return (
    <Button
      variant={buttonVariant as any}
      onClick={handleClick}
      disabled={isInitializing}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200", 
        buttonColor,
        "transform hover:scale-105", // Added hover effect (slight scale)
        className
      )}
      type="button"
    >
      <span className={spinnerClass}>{icon}</span>
      <span>{buttonText}</span>
    </Button>
  );
}
