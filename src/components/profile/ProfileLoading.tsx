
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileLoading() {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex justify-center py-8">
          <p className="text-muted-foreground">Loading profile information...</p>
        </div>
      </CardContent>
    </Card>
  );
}
