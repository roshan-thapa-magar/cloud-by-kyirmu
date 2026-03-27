"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationSettings {
  orderNotifications: boolean;
  waiterRequests: boolean;
  customerMessages: boolean;
}

interface OrderManagementProps {
  notificationSettings: NotificationSettings;
  onNotificationChange: (setting: string, value: boolean) => void;
}

export function OrderManagement({
  notificationSettings,
  onNotificationChange,
}: OrderManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
        <CardDescription>
          Notifications related to orders and customer interactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Order Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when new orders are placed
            </p>
          </div>
          <Switch
            checked={notificationSettings.orderNotifications}
            onCheckedChange={(checked) =>
              onNotificationChange("orderNotifications", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Waiter Request Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when waiters need assistance
            </p>
          </div>
          <Switch
            checked={notificationSettings.waiterRequests}
            onCheckedChange={(checked) =>
              onNotificationChange("waiterRequests", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Customer Messages</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when customers send messages
            </p>
          </div>
          <Switch
            checked={notificationSettings.customerMessages}
            onCheckedChange={(checked) =>
              onNotificationChange("customerMessages", checked)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}