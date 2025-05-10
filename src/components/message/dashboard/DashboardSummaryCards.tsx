import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCondition } from "@/types/message";
import { ChevronRight } from "lucide-react";
import { HOVER_TRANSITION } from "@/utils/hoverEffects";
import { useNavigate } from "react-router-dom";

// Define this type locally if not imported
type MessageDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface DashboardSummaryCardsProps {
  conditions: MessageCondition[];
}

export function DashboardSummaryCards({ conditions }: DashboardSummaryCardsProps) {
  const [armedCount, setArmedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Count armed messages
    const armed = conditions.filter(condition => condition.active === true).length;
    setArmedCount(armed);

    // Count pending messages (example: check for conditions that have not been triggered yet)
    const pending = conditions.filter(condition => condition.triggered !== true).length;
    setPendingCount(pending);
  }, [conditions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="bg-green-50 dark:bg-green-950/10">
        <CardContent className="flex flex-row items-center justify-between space-x-4 p-4">
          <div>
            <h2 className="text-sm font-medium">Armed Messages</h2>
            <p className="text-2xl font-bold">{armedCount}</p>
            <p className="text-sm text-green-600 dark:text-green-400">+20% vs last month</p>
          </div>
          <div className="rounded-full bg-green-600/10 p-3">
            <ChevronRight className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950/10">
        <CardContent className="flex flex-row items-center justify-between space-x-4 p-4">
          <div>
            <h2 className="text-sm font-medium">Pending Messages</h2>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">+10% vs last month</p>
          </div>
          <div className="rounded-full bg-blue-600/10 p-3">
            <ChevronRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-orange-50 dark:bg-orange-950/10">
        <CardContent className="flex flex-row items-center justify-between space-x-4 p-4">
          <div>
            <h2 className="text-sm font-medium">Total Messages</h2>
            <p className="text-2xl font-bold">{conditions.length}</p>
            <p className="text-sm text-orange-600 dark:text-orange-400">+5% vs last month</p>
          </div>
          <div className="rounded-full bg-orange-600/10 p-3">
            <ChevronRight className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
