
import { UserMenu } from "./UserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
}

export function MobileNav({ userImage, initials }: MobileNavProps) {
  return (
    <div className="flex md:hidden items-center space-x-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
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
            
            <div className="space-y-1">
              <Button variant="ghost" asChild className="justify-start w-full">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start w-full">
                <Link to="/create-message">Messages</Link>
              </Button>
              <Button variant="ghost" asChild className="justify-start w-full">
                <Link to="/recipients">Recipients</Link>
              </Button>
            </div>
            
            <div className="mt-auto space-y-3">
              <Button className="w-full" asChild>
                <Link to="/check-in">Check In</Link>
              </Button>
              <div className="flex items-center justify-between pt-4">
                <UserMenu userImage={userImage} initials={initials} />
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
