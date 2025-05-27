
import React, { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  max_messages: number;
  max_recipients: number;
  sort_order: number;
}

export function SubscriptionPlans() {
  const { isSignedIn } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalApprove = async (data: any, planId: string) => {
    try {
      const { error } = await supabase.functions.invoke('handle-paypal-subscription', {
        body: {
          subscriptionId: data.subscriptionID,
          planId: planId,
          billingCycle: selectedBilling
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your subscription has been activated",
      });

      // Refresh the page to show updated subscription status
      window.location.reload();
    } catch (error) {
      console.error('Error handling PayPal approval:', error);
      toast({
        title: "Error",
        description: "Failed to activate subscription",
        variant: "destructive"
      });
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (plan.name === 'free') return 0;
    return selectedBilling === 'monthly' ? plan.price_monthly : (plan.price_yearly || plan.price_monthly * 12);
  };

  const getPriceDisplay = (plan: SubscriptionPlan) => {
    const price = getPrice(plan);
    if (price === 0) return 'Free';
    return selectedBilling === 'monthly' 
      ? `$${price}/month` 
      : `$${price}/year`;
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-24"></div>
              <div className="h-8 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted rounded-lg p-1 flex">
          <Button
            variant={selectedBilling === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedBilling('monthly')}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            variant={selectedBilling === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedBilling('yearly')}
            className="rounded-md"
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.name === 'core' 
                ? 'border-primary shadow-lg scale-105' 
                : ''
            }`}
          >
            {plan.name === 'core' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Recommended
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.display_name}</span>
                <span className="text-2xl font-bold">
                  {getPriceDisplay(plan)}
                </span>
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {plan.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Features List */}
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <div className="pt-4">
                {plan.name === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isSignedIn ? (
                  <PayPalScriptProvider
                    options={{
                      clientId: "AeHMOGCl5vMg_CtIogFGfpuPpTNYdcMxjmZhPyNEy9p9x9UJg8BmgIJpfkYlNIm1NQOhM2lvDEXQ_OJf",
                      vault: true,
                      intent: "subscription",
                      components: "buttons"
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "rect",
                        label: "subscribe"
                      }}
                      createSubscription={(data, actions) => {
                        return actions.subscription.create({
                          plan_id: selectedBilling === 'monthly' 
                            ? `CORE_MONTHLY_PLAN` 
                            : `CORE_YEARLY_PLAN`,
                        });
                      }}
                      onApprove={(data, actions) => {
                        return handlePayPalApprove(data, plan.id);
                      }}
                      onError={(err) => {
                        console.error('PayPal error:', err);
                        toast({
                          title: "Error",
                          description: "PayPal subscription failed",
                          variant: "destructive"
                        });
                      }}
                    />
                  </PayPalScriptProvider>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Sign in to Subscribe
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
