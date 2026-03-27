import { Card, CardContent } from "@/components/ui/card";
import { LayoutGridIcon, PackageIcon, UsersIcon, ShoppingBagIcon } from "lucide-react";

interface StatsGridProps {
  data: any;
  totalOrders: number;
}

const StatCard = ({ title, value, icon: Icon, subtitle }: any) => (
  <Card className="hover:shadow-lg transition-all">
    <CardContent className="p-6">
      <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

export function StatsGrid({ data, totalOrders }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Categories" value={data.totalCategories} icon={LayoutGridIcon} />
      <StatCard title="Items" value={data.totalItems} icon={PackageIcon} />
      <StatCard title="Users" value={data.totalUsers} icon={UsersIcon} />
      <StatCard 
        title="Orders" 
        value={totalOrders} 
        icon={ShoppingBagIcon} 
        subtitle={`${data.ordersStats.running.count} running`} 
      />
    </div>
  );
}