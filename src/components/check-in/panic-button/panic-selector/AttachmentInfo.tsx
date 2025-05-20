
import { FileText, Video, Headphones } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

export interface AttachmentCounts {
  text: number;
  video: number;
  audio: number;
  other: number;
  total: number;
}

interface AttachmentInfoProps {
  attachmentInfo: AttachmentCounts | null;
}

export function AttachmentInfo({ attachmentInfo }: AttachmentInfoProps) {
  if (!attachmentInfo || attachmentInfo.total === 0) return null;
  
  return (
    <div className="flex gap-3 mt-2 text-xs text-gray-500">
      {attachmentInfo.text > 0 && (
        <span className={`flex items-center gap-1 ${HOVER_TRANSITION}`}>
          <FileText className="h-3 w-3" />
          {attachmentInfo.text}
        </span>
      )}
      {attachmentInfo.video > 0 && (
        <span className={`flex items-center gap-1 ${HOVER_TRANSITION}`}>
          <Video className="h-3 w-3" />
          {attachmentInfo.video}
        </span>
      )}
      {attachmentInfo.audio > 0 && (
        <span className={`flex items-center gap-1 ${HOVER_TRANSITION}`}>
          <Headphones className="h-3 w-3" />
          {attachmentInfo.audio}
        </span>
      )}
    </div>
  );
}
