
// Fix the message type comparison issue
// Replace:
// const isMediaMessage = message.message_type === "audio" || message.message_type === "video";
// With:
const isMediaMessage = message.message_type !== "text"; // This will be true for audio and video
