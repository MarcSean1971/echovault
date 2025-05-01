
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { CardContent, CardFooter } from "@/components/ui/card";
import { PasswordInput } from "./PasswordInput";
import { VerificationAlert } from "./VerificationAlert";
import { UserIcon, MailIcon, LockIcon, KeyIcon } from "lucide-react";

// Check if we're in development mode (using the clerk test publishable key)
const isDevelopment = import.meta.env.DEV || 
  (window.location.hostname === 'localhost') || 
  document.querySelector('script[src*="clerk.accounts.dev"]') !== null;

export function RegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);
  
  const navigate = useNavigate();
  const { signUp, setActive } = useSignUp();
  
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
      // First create the user with email and password only
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete") {
        // Sign up was successful
        await setActive({ session: result.createdSessionId });
        
        // Update the user with first name and last name
        try {
          await result.update({
            firstName,
            lastName,
          });
          
          toast({
            title: "Registration successful",
            description: "Welcome to EchoVault"
          });
          navigate("/dashboard");
        } catch (updateError: any) {
          console.error("Error updating user profile:", updateError);
          // Still proceed since the account was created successfully
          toast({
            title: "Registration successful",
            description: "Welcome to EchoVault (profile details couldn't be saved)"
          });
          navigate("/dashboard");
        }
      } else {
        // Email verification may be needed
        setShowVerificationInfo(true);
        toast({
          title: "Verification required",
          description: isDevelopment 
            ? "In development mode, verification emails aren't sent. Check your Clerk dashboard." 
            : "Please check your email to complete registration"
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.errors?.[0]?.message || "Please check your information and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      {showVerificationInfo && <VerificationAlert isDevelopment={isDevelopment} />}
      
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
            In development mode, verification emails appear in the Clerk dashboard, not your inbox
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
