
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { EyeIcon, EyeOffIcon, KeyIcon, LockIcon, MailIcon, UserIcon } from "lucide-react";
import { useSignUp, useAuth } from "@clerk/clerk-react";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { signUp, setActive } = useSignUp();

  // If already signed in, redirect to dashboard
  if (isSignedIn) {
    navigate("/dashboard");
    return null;
  }

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
        toast({
          title: "Verification required",
          description: "Please check your email to complete registration"
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

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">EchoVault</h1>
          <p className="mt-2 text-muted-foreground">Your secure digital failsafe</p>
        </div>
        
        <Card className="border-0 shadow-lg glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">
              Create your EchoVault account to get started
            </CardDescription>
          </CardHeader>
          
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
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input 
                    id="confirm-password" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Verify your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleShowConfirmPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
