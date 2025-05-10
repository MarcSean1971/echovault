
/**
 * Helper hook to create Promise<void> wrapper functions for recording handlers
 */
export function useRecordingWrappers(
  forceInitializeCamera: () => Promise<boolean>,
  startAudioRecording: () => Promise<boolean>
) {
  // Create a wrapper function that explicitly returns Promise<void>
  const handleStartVideoRecordingWrapper = async (): Promise<void> => {
    try {
      // Use void operator to explicitly discard the return value
      void await forceInitializeCamera();
      // No return statement ensures Promise<void>
    } catch (error) {
      console.error("Error in handleStartRecordingWrapper:", error);
      // No re-throw to maintain Promise<void>
    }
  };

  // Create a wrapper function for audio recording that explicitly returns Promise<void>
  const handleStartAudioRecordingWrapper = async (): Promise<void> => {
    try {
      // Use void operator to explicitly discard the boolean return value
      void await startAudioRecording();
      // No return statement ensures Promise<void>
    } catch (error) {
      console.error("Error in handleStartAudioRecordingWrapper:", error);
      // No re-throw to maintain Promise<void>
    }
  };

  return {
    handleStartVideoRecordingWrapper,
    handleStartAudioRecordingWrapper
  };
}
