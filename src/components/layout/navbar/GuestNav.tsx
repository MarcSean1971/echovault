
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function GuestNav() {
  return (
    <div className="flex items-center space-x-3">
      <Button variant="ghost" asChild className="hidden sm:flex">
        <Link to="/login">Sign in</Link>
      </Button>
      <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
        <Link to="/register">Get Started</Link>
      </Button>
      
      {/* Mobile menu for non-logged in users */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="sm:hidden rounded-full">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="backdrop-blur-md bg-background/90 border-l">
          <nav className="flex flex-col h-full py-6">
            <div className="flex items-center justify-center mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EchoVault
              </span>
            </div>
            
            <div className="mt-auto space-y-3">
              <Button className="w-full" asChild>
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
  );
}
