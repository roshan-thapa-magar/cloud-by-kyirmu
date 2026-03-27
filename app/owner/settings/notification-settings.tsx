"use client";

import { useState } from "react";
import { OrderManagement } from "@/components/settings/order-management";
import { SystemNotifications } from "@/components/settings/system-notifications";
import { SoundAudioSettings } from "@/components/settings/sound-audio-settings";
import { toast } from "sonner";

export function NotificationSettings() {
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    waiterRequests: true,
    customerMessages: false,
    systemAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
    clickSounds: true,
    notificationVolume: 75,
    notificationSound: "default",
    customSoundFile: null as File | null,
    clickSoundType: "default",
    customClickSoundFile: null as File | null,
  });

  const handleNotificationChange = (
    setting: string,
    value: boolean | number | string | File | null
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const resetNotificationSettings = () => {
    setNotificationSettings({
      orderNotifications: true,
      waiterRequests: true,
      customerMessages: false,
      systemAlerts: true,
      emailNotifications: true,
      pushNotifications: true,
      clickSounds: true,
      notificationVolume: 75,
      notificationSound: "default",
      customSoundFile: null,
      clickSoundType: "default",
      customClickSoundFile: null,
    });
    toast.success("Settings Reset", {
      description: "Notification settings have been reset to default values.",
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <OrderManagement
        notificationSettings={notificationSettings}
        onNotificationChange={handleNotificationChange}
      />
      <SystemNotifications
        notificationSettings={notificationSettings}
        onNotificationChange={handleNotificationChange}
      />
      <SoundAudioSettings
        notificationSettings={notificationSettings}
        onNotificationChange={handleNotificationChange}
        onResetSettings={resetNotificationSettings}
      />
    </div>
  );
}