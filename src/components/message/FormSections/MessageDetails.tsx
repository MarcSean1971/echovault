import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin } from "lucide-react";
import { BUTTON_HOVER_EFFECTS, HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useMessageForm } from "../MessageFormContext";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUploader } from "@/components/FileUploader";

export function MessageDetails() {
  const { 
    title, setTitle, 
    content, setContent, 
    messageType, setMessageType,
    files, setFiles,
    shareLocation, setShareLocation,
    locationName, setLocationName,
    locationLatitude, setLocationLatitude, 
    locationLongitude, setLocationLongitude
  } = useMessageForm();
  
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // Function to capture user's current location
  const captureLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      return;
    }

    setIsCapturingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationLatitude(position.coords.latitude);
        setLocationLongitude(position.coords.longitude);
        
        // Attempt to reverse geocode the location
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN}`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            setLocationName(data.features[0].place_name);
          }
        } catch (error) {
          console.error("Error getting location name:", error);
        }
        
        setIsCapturingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsCapturingLocation(false);
      }
    );
  };

  // Function to clear location data
  const clearLocation = () => {
    setLocationLatitude(null);
    setLocationLongitude(null);
    setLocationName("");
  };

  return (
    <div className="space-y-6">
      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter a title for your message"
        />
      </div>

      {/* Message type selector */}
      <div className="space-y-2">
        <Label>Message Type</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={messageType === "text" ? "default" : "outline"}
            onClick={() => setMessageType("text")}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            Text
          </Button>
          <Button
            type="button"
            variant={messageType === "audio" ? "default" : "outline"}
            onClick={() => setMessageType("audio")}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            Audio
          </Button>
          <Button
            type="button"
            variant={messageType === "video" ? "default" : "outline"}
            onClick={() => setMessageType("video")}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            Video
          </Button>
          <Button
            type="button"
            variant={messageType === "file" ? "default" : "outline"}
            onClick={() => setMessageType("file")}
            className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
          >
            File
          </Button>
        </div>
      </div>

      {/* Content field based on message type */}
      <div className="space-y-2">
        <Label htmlFor="content">Message Content</Label>
        {messageType === "text" ? (
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md min-h-[150px]"
            placeholder="Enter your message content"
          />
        ) : messageType === "audio" ? (
          <div>Audio recorder</div>
        ) : messageType === "video" ? (
          <div>Video recorder</div>
        ) : (
          <div className="p-4 bg-muted rounded-md text-center">
            Please select a message type
          </div>
        )}
      </div>

      {/* Location section */}
      <div className="space-y-4">
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="share-location" className="font-medium">Share Location</Label>
          </div>
          <Switch 
            id="share-location"
            checked={shareLocation}
            onCheckedChange={setShareLocation}
          />
        </div>
        
        {shareLocation && (
          <div className="space-y-4 pl-7">
            <p className="text-sm text-muted-foreground">
              Recipients will see your current location when viewing this message.
            </p>
            
            {locationLatitude && locationLongitude ? (
              <div className="space-y-2">
                <div className="p-3 border rounded-lg bg-background">
                  <p className="font-semibold">{locationName || 'Location captured'}</p>
                  <p className="text-sm text-muted-foreground">
                    Lat: {locationLatitude.toFixed(6)}, Long: {locationLongitude.toFixed(6)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearLocation}
                  className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.outline}`}
                >
                  Clear Location
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={captureLocation}
                disabled={isCapturingLocation}
                className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
              >
                {isCapturingLocation ? 'Capturing...' : 'Capture Current Location'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* File attachments */}
      <div className="space-y-2">
        <Label>File Attachments</Label>
        <FileUploader 
          files={files} 
          onChange={setFiles} 
        />
      </div>
    </div>
  );
}
