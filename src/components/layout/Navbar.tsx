
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bell, Menu, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl mr-6">EchoVault</Link>
          
          {/* Desktop navigation */}
          {isLoggedIn && (
            <nav className="hidden md:flex space-x-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/messages" className="text-muted-foreground hover:text-foreground">
                Messages
              </Link>
              <Link to="/files" className="text-muted-foreground hover:text-foreground">
                Files
              </Link>
              <Link to="/recipients" className="text-muted-foreground hover:text-foreground">
                Recipients
              </Link>
            </nav>
          )}
        </div>

        {isLoggedIn ? (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <Button asChild>
              <Link to="/check-in">Check In</Link>
            </Button>
            
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link to="/dashboard" className="text-foreground hover:text-primary">
                    Dashboard
                  </Link>
                  <Link to="/messages" className="text-foreground hover:text-primary">
                    Messages
                  </Link>
                  <Link to="/files" className="text-foreground hover:text-primary">
                    Files
                  </Link>
                  <Link to="/recipients" className="text-foreground hover:text-primary">
                    Recipients
                  </Link>
                  <Link to="/profile" className="text-foreground hover:text-primary">
                    Profile
                  </Link>
                  <Link to="/logout" className="text-foreground hover:text-primary">
                    Logout
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Register</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
