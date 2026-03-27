import { Card, CardContent } from "@/components/ui/card";
import { ReceiptIcon, WalletIcon } from "lucide-react";

interface PurchaseStatsProps {
  purchaseCount: number;
  purchaseAmount: number;
  formatCurrency: (amount: number) => string;
}

export function PurchaseStats({ purchaseCount, purchaseAmount, formatCurrency }: PurchaseStatsProps) {
  return (
    <>
      <h2 className="text-2xl font-semibold mt-8">Purchase Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit mb-4">
              <ReceiptIcon className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="font-semibold">Total Purchases</h3>
            <p className="text-3xl font-bold mt-2">{purchaseCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="p-2 rounded-lg bg-purple-500/10 w-fit mb-4">
              <WalletIcon className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="font-semibold">Purchase Amount</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(purchaseAmount)}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}