"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { OrderStatsGrid } from "@/components/dashboard/OrderStatsGrid";
import { PurchaseStats } from "@/components/dashboard/PurchaseStats";
import { RestaurantList } from "@/components/dashboard/RestaurantList";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { CustomRangeDialog } from "@/components/dashboard/CustomRangeDialog";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const {
    data,
    loading,
    period,
    setPeriod,
    dateRange,
    setDateRange,
    fetchData,
  } = useDashboardData(session);

  const [customOpen, setCustomOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Welcome Back!</h2>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
            <Button onClick={() => signIn()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const handlePeriodChange = (value: string) => {
    if (value === "custom") {
      setCustomOpen(true);
    } else {
      setPeriod(value);
    }
  };

  const handleCustomApply = (start: string, end: string) => {
    setDateRange({ start, end });
    setPeriod("custom");
    setCustomOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <DashboardHeader
        userName={session.user?.name || "Admin"}
        period={period}
        loading={loading}
        onPeriodChange={handlePeriodChange}
        onRefresh={() => fetchData(true)}
      />

      <StatsGrid data={data} totalOrders={data.ordersStats.running.count + data.ordersStats.completed.count + data.ordersStats.cancelled.count} />
      
      <OrderStatsGrid ordersStats={data.ordersStats} formatCurrency={formatCurrency} />
      
      <PurchaseStats
        purchaseCount={data.totalPurchaseCount}
        purchaseAmount={data.totalPurchaseAmount}
        formatCurrency={formatCurrency}
      />
      
      <RestaurantList restaurants={data.restaurants} />
      
      <DashboardSummary
        period={period}
        completedAmount={data.ordersStats.completed.amount}
        runningAmount={data.ordersStats.running.amount}
        purchaseAmount={data.totalPurchaseAmount}
        formatCurrency={formatCurrency}
      />

      <CustomRangeDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onApply={handleCustomApply}
      />
    </div>
  );
}

// Helper function
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);