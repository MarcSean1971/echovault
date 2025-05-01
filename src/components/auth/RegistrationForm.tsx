
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { CardContent, CardFooter } from "@/components/ui/card";
import { PasswordInput } from "./PasswordInput";
import { UserIcon, MailIcon, LockIcon, KeyIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthError } from "@supabase/supabase-js";

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || 
  (window.location.hostname === 'localhost');

export function RegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Sign up with Supabase, including metadata for the profile
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      });

      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        // Email verification needed
        toast({
          title: "Verification required",
          description: isDevelopment 
            ? "In development mode, check the Supabase dashboard for verification emails." 
            : "Please check your email to complete registration"
        });
      } else {
        // User is signed in
        toast({
          title: "Registration successful",
          description: "Welcome to EchoVault"
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const authError = error as AuthError;
      toast({
        title: "Registration failed",
        description: authError.message || "Please check your information and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input 
                id="firstName" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input 
                id="lastName" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <PasswordInput
          id="password"
          label="Password"
          icon={<LockIcon className="h-5 w-5 text-muted-foreground" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a secure password"
        />
        
        <PasswordInput
          id="confirm-password"
          label="Confirm Password"
          icon={<KeyIcon className="h-5 w-5 text-muted-foreground" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Verify your password"
        />
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4 pt-2">
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
        
        {isDevelopment && (
          <p className="text-sm text-muted-foreground text-center px-2">
            In development mode, check the Supabase dashboard for verification emails
          </p>
        )}
        
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </form>
  );
}
