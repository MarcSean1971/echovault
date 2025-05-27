
import React from "react";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { CurrentSubscription } from "@/components/subscription/CurrentSubscription";
import { Card, CardContent } from "@/components/ui/card";

export default function Subscription() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you. Upgrade or downgrade at any time.
          </p>
        </div>

        {/* Current Subscription Status */}
        <CurrentSubscription />

        {/* Available Plans */}
        <SubscriptionPlans />
      </div>
    </div>
  );
}
