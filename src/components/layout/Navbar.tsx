
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Menu, MessageSquare, Settings, Upload, Users2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [initials, setInitials] = useState("U");
  const [userImage, setUserImage] = useState<string | null>(null);

  // Determine user initials and image when user data is loaded
  useEffect(() => {
    if (user) {
      // Get first letter of first and last name if available
      const firstInitial = user.firstName ? user.firstName[0] : "";
      const lastInitial = user.lastName ? user.lastName[0] : "";
      setInitials((firstInitial + lastInitial).toUpperCase() || "U");
      
      // Set user image if available
      setUserImage(user.imageUrl);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account"
      });
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

  // Use the auth check from Clerk if available, otherwise fall back to prop
  const authenticated = isLoaded ? isSignedIn : isLoggedIn;

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="font-serif font-bold text-2xl mr-6 gradient-text">
            EchoVault
          </Link>
          
          {/* Desktop navigation */}
          {authenticated && (
            <nav className="hidden md:flex space-x-6">
              <Link to="/dashboard" className="text-foreground/80 hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link to="/create-message" className="text-foreground/80 hover:text-primary transition-colors">
                Messages
              </Link>
              <Link to="/upload-file" className="text-foreground/80 hover:text-primary transition-colors">
                Files
              </Link>
              <Link to="/recipients" className="text-foreground/80 hover:text-primary transition-colors">
                Recipients
              </Link>
            </nav>
          )}
        </div>

        {authenticated ? (
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="outline" size="icon" className="rounded-full hidden md:flex" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button asChild className="hidden md:flex bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
              <Link to="/check-in">Check In</Link>
            </Button>
            
            <Avatar className="h-9 w-9 transition-transform hover:scale-105">
              {userImage ? (
                <AvatarImage src={userImage} alt="User profile" />
              ) : (
                <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
              )}
            </Avatar>
            
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
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
                        <Link to="/upload-file" className="flex gap-2">
                          <Upload className="h-5 w-5" />Files
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
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
              <Link to="/register">Get Started</Link>
            </Button>
            
            {/* Mobile menu for non-logged in users */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="grid gap-6 py-6">
                  <div className="flex items-center justify-center mb-4">
                    <h2 className="text-xl font-bold gradient-text">EchoVault</h2>
                  </div>
                  <div className="grid gap-3">
                    <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
                      <Link to="/register">Get Started</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    </header>
  );
}
