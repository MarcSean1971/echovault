
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Mic, MicOff, Play, Pause, Stop, Trash2, Check } from "lucide-react";

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, audioBase64: string) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onAudioReady, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check for browser support
  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsBrowserSupported(false);
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support audio recording functionality.",
        variant: "destructive"
      });
    }
    
    return () => {
      // Clean up resources when component unmounts
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        
        if (isRecording) {
          mediaRecorderRef.current.stop();
        }
      }
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, audioURL]);
  
  const startRecording = async () => {
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);
        
        // Close the stream tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording and update state
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Start the timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Failed",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume the timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  const handleAccept = async () => {
    if (!audioBlob) return;
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Audio = base64data.split(",")[1];
        onAudioReady(audioBlob, base64Audio);
      };
    } catch (err) {
      console.error("Error processing audio:", err);
      toast({
        title: "Error",
        description: "Failed to process the recorded audio.",
        variant: "destructive"
      });
    }
  };
  
  const handleReset = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (!isBrowserSupported) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">Your browser doesn't support audio recording.</p>
        <Button onClick={onCancel} variant="outline">Cancel</Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Recording controls or playback controls */}
        {!audioURL ? (
          // Recording UI
          <>
            <div className="relative w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2">
              {isRecording ? (
                <div className={`w-12 h-12 rounded-full bg-red-500 ${isPaused ? 'opacity-50' : 'animate-pulse'}`} />
              ) : (
                <Mic className="w-10 h-10 text-primary" />
              )}
            </div>
            
            <div className="text-center mb-4">
              {isRecording ? (
                <div className="text-lg font-medium">{formatDuration(recordingDuration)}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Click to start recording</div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isRecording ? (
                <>
                  {isPaused ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={resumeRecording}
                      className="text-primary"
                    >
                      <Mic className="w-4 h-4 mr-1" /> Resume
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={pauseRecording}
                      className="text-muted-foreground"
                    >
                      <Pause className="w-4 h-4 mr-1" /> Pause
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={stopRecording}
                  >
                    <Stop className="w-4 h-4 mr-1" /> Stop
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={startRecording}
                  className="bg-primary"
                >
                  <Mic className="w-4 h-4 mr-1" /> Start Recording
                </Button>
              )}
            </div>
          </>
        ) : (
          // Playback UI
          <>
            <div className="relative w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-full rounded-full"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-primary" />
                ) : (
                  <Play className="w-10 h-10 text-primary" />
                )}
              </Button>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-lg font-medium">{formatDuration(recordingDuration)}</div>
            </div>
            
            <audio 
              ref={audioRef} 
              src={audioURL} 
              onEnded={handleAudioEnded} 
              className="hidden" 
            />
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleReset}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Discard
              </Button>
              <Button 
                size="sm"
                onClick={handleAccept}
              >
                <Check className="w-4 h-4 mr-1" /> Accept
              </Button>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
