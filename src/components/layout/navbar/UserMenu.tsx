
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, MessageSquare, Users2, Clock, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

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
    <>
      {/* Desktop dropdown menu */}
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-10 w-10 transition-transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary/20">
              {userImage ? (
                <AvatarImage src={userImage} alt="User profile" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex gap-2 items-center cursor-pointer">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/create-message" className="flex gap-2 items-center cursor-pointer">
                <MessageSquare className="h-4 w-4" /> Messages
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/recipients" className="flex gap-2 items-center cursor-pointer">
                <Users2 className="h-4 w-4" /> Recipients
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/check-ins" className="flex gap-2 items-center cursor-pointer">
                <Clock className="h-4 w-4" /> Check-ins
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex gap-2 items-center text-destructive focus:text-destructive cursor-pointer"
              onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile sheet menu */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Avatar className="h-9 w-9 transition-transform hover:scale-105 cursor-pointer border-2 border-transparent hover:border-primary/20">
            {userImage ? (
              <AvatarImage src={userImage} alt="User profile" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            )}
          </Avatar>
        </SheetTrigger>
        <SheetContent side="right" className="backdrop-blur-md bg-background/90 border-l">
          <nav className="flex flex-col h-full py-6">
            <div className="flex items-center justify-center mb-8">
              <Avatar className="h-16 w-16">
                {userImage ? (
                  <AvatarImage src={userImage} alt="User profile" />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">{initials}</AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="space-y-1">
              <Button variant="ghost" asChild className="justify-start w-full">
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Profile
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start w-full">
                <Link to="/create-message" className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Messages
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start w-full">
                <Link to="/recipients" className="flex items-center gap-2">
                  <Users2 className="h-5 w-5" /> Recipients
                </Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start w-full">
                <Link to="/check-ins" className="flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Check-ins
                </Link>
              </Button>
            </div>
            
            <div className="mt-auto">
              <Button className="w-full mb-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                <Link to="/check-in">Check In Now</Link>
              </Button>
              
              <Button variant="outline" onClick={handleSignOut} className="w-full">
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
