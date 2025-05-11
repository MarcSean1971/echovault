
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { CheckIn } from "@/types/message";

export default function CheckIns() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
    if (!userId) return;
    
    const fetchCheckIns = async () => {
      setIsLoading(true);
      try {
        // This would call an API to fetch check-ins
        // For now we'll simulate this with dummy data
        const dummyCheckIns: CheckIn[] = [
          {
            id: "1",
            user_id: userId,
            timestamp: new Date().toISOString(),
            method: "app"
          },
          {
            id: "2",
            user_id: userId,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            method: "app"
          },
          {
            id: "3",
            user_id: userId,
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
            method: "email",
            device_info: "Desktop Chrome"
          }
        ];
        
        setCheckIns(dummyCheckIns);
      } catch (error) {
        console.error("Error fetching check-ins:", error);
        toast({
          title: "Error",
          description: "Failed to load your check-in history",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCheckIns();
  }, [userId]);
  
  const filteredCheckIns = selectedDate
    ? checkIns.filter(checkIn => {
        const checkInDate = new Date(checkIn.timestamp);
        return (
          checkInDate.getDate() === selectedDate.getDate() &&
          checkInDate.getMonth() === selectedDate.getMonth() &&
          checkInDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : checkIns;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/check-in")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Check-In
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Check-In History</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
            <CardDescription>
              Select a date to view check-ins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border rounded-md p-1"
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate 
                ? `Check-Ins for ${format(selectedDate, "MMMM d, yyyy")}`
                : "All Check-Ins"}
            </CardTitle>
            <CardDescription>
              Your check-in activity and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8">Loading check-in history...</p>
            ) : filteredCheckIns.length > 0 ? (
              <div className="space-y-4">
                {filteredCheckIns.map(checkIn => (
                  <div key={checkIn.id} className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <p className="font-medium">
                        {format(new Date(checkIn.timestamp), "PPP 'at' p")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Method: {checkIn.method}
                      </p>
                      {checkIn.device_info && (
                        <p className="text-xs text-muted-foreground">
                          Device: {checkIn.device_info}
                        </p>
                      )}
                    </div>
                    <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded text-xs font-medium">
                      Successful
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No check-ins found for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
