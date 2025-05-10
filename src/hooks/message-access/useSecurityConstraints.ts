
// Update the type conversion logic
// Replace the problematic code with:
const convertedMessage = {
  ...data,
  attachments: Array.isArray(data.attachments) 
    ? data.attachments.map((att: any) => ({
        id: att.id || "",
        message_id: att.message_id || data.id,
        file_name: att.file_name || att.name || "",
        file_size: att.file_size || att.size || 0,
        file_type: att.file_type || att.type || "",
        url: att.url || att.path || "",
        created_at: att.created_at || data.created_at,
        path: att.path,
        name: att.name,
        size: att.size,
        type: att.type
      }))
    : []
} as Message;
