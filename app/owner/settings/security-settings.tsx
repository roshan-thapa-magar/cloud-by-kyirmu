"use client";

import { ChangePassword } from "@/components/settings/change-password";

export function SecuritySettings() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <ChangePassword />
    </div>
  );
}