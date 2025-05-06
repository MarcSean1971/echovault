
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { AttachmentAccessProps, AttachmentAccessUtilities } from "../types";

export interface DownloadHandlerProps {
  props: AttachmentAccessProps;
  utilities: AttachmentAccessUtilities;
}

export interface DownloadHandlerResult {
  directUrl: string | null;
  downloadFile: (method: AccessMethod) => Promise<boolean>;
  openFile: (method: AccessMethod) => Promise<boolean>;
  tryDirectAccess: () => boolean;
  retryAccess: () => Promise<boolean>;
}
