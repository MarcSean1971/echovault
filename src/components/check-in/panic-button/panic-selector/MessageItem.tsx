
import { MessageDetails } from "../types";
import { AttachmentInfo, AttachmentCounts } from "./AttachmentInfo";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";

interface MessageItemProps {
  message: {
    message_id: string;
    recipients?: any[];
  };
  details: MessageDetails | undefined;
  attachmentInfo: {
    counts: {
      text: number;
      video: number;
      audio: number;
      other: number;
    };
    total: number;
  } | null;
  isSelected: boolean;
  onSelect: (messageId: string) => void;
}

export function MessageItem({ 
  message, 
  details, 
  attachmentInfo, 
  isSelected, 
  onSelect 
}: MessageItemProps) {
  // Transform the attachmentInfo to match AttachmentCounts type
  const formattedAttachmentInfo: AttachmentCounts | null = attachmentInfo 
    ? {
        text: attachmentInfo.counts.text,
        video: attachmentInfo.counts.video,
        audio: attachmentInfo.counts.audio,
        other: attachmentInfo.counts.other,
        total: attachmentInfo.total
      }
    : null;

  return (
    <div 
      className={`p-4 border rounded-md cursor-pointer transition-all ${
        isSelected 
          ? "border-red-500 bg-red-50" 
          : "border-gray-200 hover:border-red-200"
      } ${HOVER_TRANSITION}`}
      onClick={() => onSelect(message.message_id)}
    >
      <div className="font-medium">{details?.title || "Emergency Message"}</div>
      
      {details?.content && (
        <div className="text-sm text-gray-500 line-clamp-2 mt-1">
          {details.content}
        </div>
      )}
      
      <AttachmentInfo attachmentInfo={formattedAttachmentInfo} />
      
      <div className="text-xs text-gray-400 mt-1">
        Recipients: {message.recipients?.length || 0}
      </div>
    </div>
  );
}
