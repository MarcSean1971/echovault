
import { AttachmentAccessProps, AttachmentAccessUtilities } from "../types";
import { useFileDownloadHandler } from "./fileDownloadHandler";
import { useFileOpenHandler } from "./fileOpenHandler";
import { useDirectAccessHandler } from "./directAccessHandler";
import { useRetryAccessHandler } from "./retryAccessHandler";
import { AccessMethod } from "@/components/message/detail/attachment/types";
import { DownloadHandlerResult } from "./types";

/**
 * Combined hook for handling file download operations
 */
export function useDownloadHandlers(
  props: AttachmentAccessProps,
  utilities: AttachmentAccessUtilities
): DownloadHandlerResult {
  // Create shared props object for all handlers
  const handlerProps = { props, utilities };
  
  // Use the individual handler hooks
  const { downloadFile } = useFileDownloadHandler(handlerProps);
  const { openFile } = useFileOpenHandler(handlerProps);
  const { tryDirectAccess } = useDirectAccessHandler(handlerProps);
  const { retryAccess } = useRetryAccessHandler(handlerProps);
  
  // We'll use the directUrl from the directAccessHandler
  const { directUrl } = useDirectAccessHandler(handlerProps);
  
  return {
    directUrl,
    downloadFile,
    openFile,
    tryDirectAccess,
    retryAccess
  };
}
