
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ErrorStateProps {
  error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="p-6 border-red-200">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Access Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">
            If you believe this is a mistake, please contact the sender of this message.
          </p>
        </div>
      </Card>
    </div>
  );
};
