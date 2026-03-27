import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClockIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

interface OrderStatsGridProps {
  ordersStats: {
    running: { count: number; amount: number };
    completed: { count: number; amount: number };
    cancelled: { count: number; amount: number };
  };
  formatCurrency: (amount: number) => string;
}

const OrderCard = ({ title, stats, icon: Icon, color }: any) => (
  <Card className="hover:shadow-lg transition-all">
    <CardContent className="p-6">
      <div className={`p-2 rounded-lg w-fit mb-4 bg-${color}-500/10`}>
        <Icon className={`h-5 w-5 text-${color}-500`} />
      </div>
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Count</span>
          <span className="font-bold">{stats.count}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold">{stats.amount}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function OrderStatsGrid({ ordersStats, formatCurrency }: OrderStatsGridProps) {
  return (
    <>
      <h2 className="text-2xl font-semibold mt-8">Order Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OrderCard 
          title="Running Orders" 
          stats={{ ...ordersStats.running, amount: formatCurrency(ordersStats.running.amount) }} 
          icon={ClockIcon} 
          color="yellow" 
        />
        <OrderCard 
          title="Completed Orders" 
          stats={{ ...ordersStats.completed, amount: formatCurrency(ordersStats.completed.amount) }} 
          icon={CheckCircleIcon} 
          color="green" 
        />
        <OrderCard 
          title="Cancelled Orders" 
          stats={{ ...ordersStats.cancelled, amount: formatCurrency(ordersStats.cancelled.amount) }} 
          icon={XCircleIcon} 
          color="red" 
        />
      </div>
    </>
  );
}