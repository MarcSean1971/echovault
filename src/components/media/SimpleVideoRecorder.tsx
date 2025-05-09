import React, { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { AlertCircle, Video } from "lucide-react";
import { formatTime } from "@/utils/mediaUtils";

interface SimpleVideoRecorderProps {
  onVideoReady: (videoBlob: Blob, videoBase64: string) => void;
  onCancel: () => void;
}

export function SimpleVideoRecorder({ onVideoReady, onCancel }: SimpleVideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  
  useEffect(() => {
    // Check browser support for MediaRecorder
    setIsBrowserSupported(typeof MediaRecorder !== "undefined");
  }, []);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (recording) {
      intervalId = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    
    return () => clearInterval(intervalId);
  }, [recording]);

  useEffect(() => {
    const getMediaStream = async () => {
      setIsInitializing(true);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
        setStream(mediaStream);
      } catch (error: any) {
        console.error("Error accessing media devices:", error);
        setPermissionDenied(true);
      } finally {
        setIsInitializing(false);
      }
    };
    
    if (isBrowserSupported && !stream) {
      getMediaStream();
    }
  }, [isBrowserSupported, stream]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startRecording = () => {
    if (!stream) return;

    setRecordedChunks([]);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    recorder.onstop = async () => {
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      const videoBase64 = await blobToBase64(videoBlob);
      onVideoReady(videoBlob, videoBase64);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onCancel();
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  if (!isBrowserSupported) {
    return (
      <div className="text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
        <p className="text-red-500">
          Your browser does not support video recording.
        </p>
        <Button onClick={onCancel}>Go Back</Button>
      </div>
    );
  }
  
  if (permissionDenied) {
    return (
      <div className="text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-500" />
        <p className="text-red-500">
          Camera permission denied. Please allow camera access to record a video.
        </p>
        <Button onClick={onCancel}>Go Back</Button>
      </div>
    );
  }
  
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <Spinner className="h-6 w-6 mb-2" />
        <p className="text-sm text-muted-foreground">Initializing camera...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <video
        ref={videoRef}
        className="w-full aspect-video rounded-md"
        autoPlay
        muted
      />
      <div className="mt-2 text-sm text-muted-foreground">
        Recording time: {formatTime(recordingDuration)}
      </div>
      <div className="mt-4 flex gap-2">
        {!recording ? (
          <Button onClick={startRecording} disabled={!stream}>
            {stream ? "Start Recording" : "Camera Not Ready"}
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive">
            Stop Recording
          </Button>
        )}
        <Button onClick={cancelRecording} variant="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
}

