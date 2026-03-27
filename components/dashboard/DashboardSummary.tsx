import { Card, CardContent } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";

interface DashboardSummaryProps {
  period: string;
  completedAmount: number;
  runningAmount: number;
  purchaseAmount: number;
  formatCurrency: (amount: number) => string;
}

export function DashboardSummary({ 
  period, 
  completedAmount, 
  runningAmount, 
  purchaseAmount, 
  formatCurrency 
}: DashboardSummaryProps) {
  const profit = completedAmount + runningAmount - purchaseAmount;
  const profitPercent = purchaseAmount > 0 ? ((profit / purchaseAmount) * 100).toFixed(1) : "0";

  const getPeriodLabel = () => {
    switch (period) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      case "custom": return "Custom Range";
      default: return "Selected Period";
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Period Summary</h3>
              <p className="text-sm text-muted-foreground">{getPeriodLabel()}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(completedAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-yellow-500">{formatCurrency(runningAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchases</p>
              <p className="text-xl font-bold text-blue-500">{formatCurrency(purchaseAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit</p>
              <p className={`text-xl font-bold ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(profit)} ({profit >= 0 ? "+" : ""}{profitPercent}%)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}