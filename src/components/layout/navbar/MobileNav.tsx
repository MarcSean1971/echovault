
import { UserMenu } from "./UserMenu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShieldAlert, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileNavProps {
  userImage: string | null;
  initials: string;
  isAdmin?: boolean;
}

export function MobileNav({ userImage, initials, isAdmin = false }: MobileNavProps) {
  return (
    <div className="flex md:hidden items-center space-x-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="backdrop-blur-xl bg-background/90 border-l">
          <nav className="flex flex-col h-full py-6">
            <div className="flex items-center justify-center mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                EchoVault
              </span>
            </div>
            
            <div className="space-y-1">
              {isAdmin ? (
                <>
                  <Button 
                    variant="ghost" 
                    asChild 
                    className="justify-start w-full text-destructive hover:bg-accent/10 transition-colors"
                  >
                    <Link to="/admin" className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start w-full hover:bg-accent/10 transition-colors">
                    <Link to="/admin/users">Users</Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start w-full hover:bg-accent/10 transition-colors">
                    <Link to="/admin/messages">Messages</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="justify-start w-full hover:bg-accent/10 transition-colors">
                    <Link to="/messages">Messages</Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start w-full hover:bg-accent/10 transition-colors">
                    <Link to="/recipients">Recipients</Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start w-full hover:bg-accent/10 transition-colors">
                    <Link to="/check-in" className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Check In
                    </Link>
                  </Button>
                </>
              )}
            </div>
            
            <div className="mt-auto space-y-3">
              {!isAdmin && (
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md" asChild>
                  <Link to="/check-in" className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Check In
                  </Link>
                </Button>
              )}
              <div className="flex items-center justify-between pt-4">
                <UserMenu userImage={userImage} initials={initials} isAdmin={isAdmin} />
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
