
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function GuestNav() {
  return (
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
  );
}
