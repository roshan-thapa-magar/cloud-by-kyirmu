"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface AccountInformationProps {
  joinDate: string;
  accountExpiryDate: string;
}

export function AccountInformation({
  joinDate,
  accountExpiryDate,
}: AccountInformationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>
          Your account status and important dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Join Date
              </p>
              <p className="text-base font-semibold">{joinDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Account Renewal Date
              </p>
              <p className="text-base font-semibold">{accountExpiryDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}