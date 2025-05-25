
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { checkProfileCompletion } from "@/utils/profileCompletion";
import { ProfileData } from "@/services/profileService";

interface ProfileCompletionGuardProps {
  profile: ProfileData | null;
  children: React.ReactNode;
}

export function ProfileCompletionGuard({ profile, children }: ProfileCompletionGuardProps) {
  const completionStatus = checkProfileCompletion(profile);

  if (!completionStatus.isComplete) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Profile Completion Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 mb-4">
                You must complete your profile before accessing the application. 
                Please fill in all mandatory fields below.
              </p>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-amber-700 mb-2">
                  <span>Profile Completion</span>
                  <span>{completionStatus.completionPercentage}%</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${completionStatus.completionPercentage}%` }}
                  />
                </div>
              </div>
              {completionStatus.missingFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-2">Missing required fields:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {completionStatus.missingFields.map((field, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-amber-600 rounded-full" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
