"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ChefHat, Clock, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { fetchRestaurant, createRestaurant, updateRestaurant } from "@/services/basicInformation.api";
import { RestaurantLogoUpload } from "./LogoUpload";
import { RestaurantBannersUpload } from "./BannersUpload";

interface RestaurantData {
  _id?: string;
  restaurantName: string;
  openingTime: string;
  closingTime: string;
  operatingDays: Record<string, boolean>;
  shopStatus: "open" | "closed";
}

export function RestaurantInformation() {
  const [restaurantData, setRestaurantData] = useState<RestaurantData>({
    restaurantName: "",
    openingTime: "",
    closingTime: "",
    operatingDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    shopStatus: "closed",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load restaurant on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const restaurant = await fetchRestaurant();
        if (restaurant) {
          setRestaurantData({
            _id: restaurant._id,
            restaurantName: restaurant.restaurantName,
            openingTime: restaurant.openingTime,
            closingTime: restaurant.closingTime,
            operatingDays: Object.fromEntries(
              ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                (day) => [day, restaurant.operatingDays?.includes(day) || false]
              )
            ),
            shopStatus: restaurant.shopStatus || "closed",
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      if (!restaurantData.restaurantName?.trim()) return toast.error("Restaurant name is required");
      if (!restaurantData.openingTime || !restaurantData.closingTime) return toast.error("Opening and closing time are required");
      if (restaurantData.openingTime >= restaurantData.closingTime) return toast.error("Opening time must be before closing time");
      if (!Object.values(restaurantData.operatingDays).some(Boolean)) return toast.error("Select at least one operating day");

      const payload = {
        ...restaurantData,
        operatingDays: Object.entries(restaurantData.operatingDays).filter(([_, v]) => v).map(([day]) => day),
      };

      if (restaurantData._id) {
        await updateRestaurant(payload);
        toast.success("Restaurant information updated");
      } else {
        const created = await createRestaurant(payload);
        setRestaurantData(prev => ({ ...prev, _id: created._id }));
        toast.success("Restaurant created successfully");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save restaurant");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => toast.info("Form reset");

  const selectAll = () => setRestaurantData(prev => ({ ...prev, operatingDays: Object.fromEntries(Object.keys(prev.operatingDays).map(day => [day, true])) }));
  const clearAll = () => setRestaurantData(prev => ({ ...prev, operatingDays: Object.fromEntries(Object.keys(prev.operatingDays).map(day => [day, false])) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ChefHat className="h-5 w-5" /> Restaurant Information
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Manage your restaurant details, banner, and operating hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 sm:space-y-8">
        <RestaurantLogoUpload />
        <Separator />
        <RestaurantBannersUpload />
        <Separator />

        {/* Basic Info */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Basic Information</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">Restaurant Name *</Label>
              <Input
                id="restaurant-name"
                value={restaurantData.restaurantName}
                onChange={(e) => setRestaurantData(prev => ({ ...prev, restaurantName: e.target.value }))}
                placeholder="Enter restaurant name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening-time">Opening Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="opening-time"
                    type="time"
                    value={restaurantData.openingTime}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, openingTime: e.target.value }))}
                    className="pl-8 sm:pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing-time">Closing Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="closing-time"
                    type="time"
                    value={restaurantData.closingTime}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, closingTime: e.target.value }))}
                    className="pl-8 sm:pl-9"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Operating Days */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <Label className="text-base font-medium">Operating Days *</Label>
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button type="button" variant="outline" size="sm" onClick={clearAll}>Clear All</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
            {Object.entries(restaurantData.operatingDays).map(([day, isChecked]) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={isChecked}
                  onCheckedChange={(checked) => setRestaurantData(prev => ({ ...prev, operatingDays: { ...prev.operatingDays, [day]: checked as boolean } }))}
                />
                <Label htmlFor={day} className="text-sm font-medium leading-none capitalize cursor-pointer">{day}</Label>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Select the days your restaurant is open</p>
        </div>

        <Separator />

        {/* Shop Status */}
        <div className="space-y-2">
          <Label htmlFor="shop-status">Shop Status</Label>
          <Select
            value={restaurantData.shopStatus}
            onValueChange={(value) => setRestaurantData(prev => ({ ...prev, shopStatus: value as "open" | "closed" }))}
          >
            <SelectTrigger id="shop-status" className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button type="button" className="flex-1 sm:flex-none" onClick={handleSubmit} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Restaurant Information"}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}