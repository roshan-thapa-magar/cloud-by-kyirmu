import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RefreshCwIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DashboardHeaderProps {
  userName: string;
  period: string;
  loading: boolean;
  onPeriodChange: (value: string) => void;
  onRefresh: () => void;
}

export function DashboardHeader({ userName, period, loading, onPeriodChange, onRefresh }: DashboardHeaderProps) {
  const getPeriodLabel = () => {
    switch (period) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      case "custom": return "Custom Range";
      default: return "Select Period";
    }
  };

  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <div>
        <h1 className="text-4xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back, {userName}!</p>
      </div>
      <div className="flex gap-3">
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[200px]">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <SelectValue>{getPeriodLabel()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Today</SelectItem>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
            <Separator />
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCwIcon className={`h-4 w-4 ${loading && "animate-spin"}`} />
        </Button>
      </div>
    </div>
  );
}