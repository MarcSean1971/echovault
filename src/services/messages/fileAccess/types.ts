
import { AccessMethod, AccessMode } from "@/components/message/detail/attachment/types";

export interface AccessMethodData {
  url: string | null;
  method: AccessMethod | null;
}

export interface DownloadOptions {
  fileName: string;
  fileType: string;
  forDownload: boolean;
}
