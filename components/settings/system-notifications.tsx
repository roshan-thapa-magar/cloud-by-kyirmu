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
  systemAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface SystemNotificationsProps {
  notificationSettings: NotificationSettings;
  onNotificationChange: (setting: string, value: boolean) => void;
}

export function SystemNotifications({
  notificationSettings,
  onNotificationChange,
}: SystemNotificationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Notifications</CardTitle>
        <CardDescription>
          System alerts and communication preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">System Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Important system updates and alerts
            </p>
          </div>
          <Switch
            checked={notificationSettings.systemAlerts}
            onCheckedChange={(checked) =>
              onNotificationChange("systemAlerts", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            checked={notificationSettings.emailNotifications}
            onCheckedChange={(checked) =>
              onNotificationChange("emailNotifications", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive push notifications on your device
            </p>
          </div>
          <Switch
            checked={notificationSettings.pushNotifications}
            onCheckedChange={(checked) =>
              onNotificationChange("pushNotifications", checked)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}