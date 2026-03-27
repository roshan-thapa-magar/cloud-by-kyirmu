import React, { useState } from "react";
import { PersonalInformation } from "@/components/settings/personal-information";
import { RestaurantInformation } from "@/components/settings/restaurant/information";

export function ProfileSettings() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PersonalInformation />
      <RestaurantInformation
      />
    </div>
  );
}