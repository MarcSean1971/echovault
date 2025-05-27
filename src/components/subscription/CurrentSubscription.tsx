
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, CreditCard, AlertTriangle } from "lucide-react";

interface UserSubscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plans: {
    display_name: string;
    price_monthly: number;
    price_yearly: number;
  };
}

export function CurrentSubscription() {
  const { isSignedIn } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      fetchCurrentSubscription();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const fetchCurrentSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            display_name,
            price_monthly,
            price_yearly
          )
        `)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const { error } = await supabase.functions.invoke('cancel-paypal-subscription', {
        body: { subscriptionId: subscription?.id }
      });

      if (error) throw error;

      await fetchCurrentSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  if (!isSignedIn) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Sign in to view your subscription status
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <Badge variant="outline">Free Plan</Badge>
            <p className="text-sm text-muted-foreground">
              You're currently on the free plan with limited features
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Current Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{subscription.subscription_plans.display_name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {subscription.billing_cycle} billing
            </p>
          </div>
          {getStatusBadge(subscription.status)}
        </div>

        {subscription.current_period_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {subscription.cancel_at_period_end 
                ? `Expires on ${formatDate(subscription.current_period_end)}`
                : `Renews on ${formatDate(subscription.current_period_end)}`
              }
            </span>
          </div>
        )}

        {subscription.cancel_at_period_end && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Your subscription will be cancelled at the end of the current period
            </span>
          </div>
        )}

        {subscription.status === 'active' && !subscription.cancel_at_period_end && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelSubscription}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Cancel Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
