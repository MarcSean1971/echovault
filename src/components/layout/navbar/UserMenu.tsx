
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Users2 } from "lucide-react";

interface UserMenuProps {
  userImage: string | null;
  initials: string;
}

export function UserMenu({ userImage, initials }: UserMenuProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "There was an issue signing you out",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Avatar className="h-9 w-9 transition-transform hover:scale-105">
            {userImage ? (
              <AvatarImage src={userImage} alt="User profile" />
            ) : (
              <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
            )}
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[380px]">
        <nav className="grid gap-6 py-6">
          <div className="flex items-center justify-center mb-4">
            <Avatar className="h-16 w-16">
              {userImage ? (
                <AvatarImage src={userImage} alt="User profile" />
              ) : (
                <AvatarFallback className="bg-primary text-white text-xl">{initials}</AvatarFallback>
              )}
            </Avatar>
          </div>
          
          <div className="grid gap-3">
            <h2 className="text-lg font-medium">Menu</h2>
            <div className="grid gap-1.5">
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/dashboard" className="flex gap-2">
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/create-message" className="flex gap-2">
                  <MessageSquare className="h-5 w-5" />Messages
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/recipients" className="flex gap-2">
                  <Users2 className="h-5 w-5" />Recipients
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/settings" className="flex gap-2">
                  <Settings className="h-5 w-5" />Settings
                </Link>
              </Button>
            </div>
          </div>

          <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
            <Link to="/check-in">Check In Now</Link>
          </Button>
          
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
