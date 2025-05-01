
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface PasswordInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export function PasswordInput({ 
  id, 
  label, 
  icon, 
  value, 
  onChange, 
  placeholder,
  required = true 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <Input 
          id={id} 
          type={showPassword ? "text" : "password"} 
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pl-10"
          required={required}
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
  );
}
