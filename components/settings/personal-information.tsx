"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/UserContext";
import moment from "moment";
import GoogleMapComponent from "../google-map-component";

interface ProfileData {
  name: string;
  email: string;
  contactNumber: string;
  joinDate: string;
  accountUpdated: string;
  address: string;
  profileImage: string;
}

export function PersonalInformation() {
  const { data: session } = useSession();
  const { user, fetchUser, updateUser, loading } = useUser();
  const userId = session?.user?._id;

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    contactNumber: "",
    joinDate: "",
    accountUpdated: "",
    address: "",
    profileImage: "",
  });

  // Fetch user when userId becomes available
  useEffect(() => {
    if (userId) fetchUser(userId);
  }, [userId, fetchUser]);

  // Sync profileData with fetched user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        contactNumber: user.phone || "",
        joinDate: user.createdAt
          ? moment(user.createdAt).format("MMMM Do, YYYY, h:mm A")
          : "",
        accountUpdated: user.updatedAt
          ? moment(user.updatedAt).format("MMMM Do, YYYY, h:mm A")
          : "",
        address: user.address || "",
        profileImage:
          user.image ||
          "https://res.cloudinary.com/dzbtzumsd/image/upload/v1758364107/users/ew23jqr9zvvjmsiialpk.jpg",
      });
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData((prev) => ({
          ...prev,
          profileImage: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return toast.error("User not loaded yet");

    const { success, message } = await updateUser(userId, {
      name: profileData.name,
      image: profileData.profileImage,
      address: profileData.address,
      phone: profileData.contactNumber,
    });

    if (success) {
      toast.success(message || "Profile updated successfully!");
    } else {
      toast.error(message || "Failed to update profile");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your personal details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={profileData.profileImage} alt="Profile" />
              <AvatarFallback>
                {profileData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="w-full sm:w-auto">
              <Label htmlFor="profile-image" className="cursor-pointer">
                <div className="flex items-center justify-center sm:justify-start space-x-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>Change Photo</span>
                </div>
              </Label>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <p className="text-sm text-muted-foreground mt-1 text-center sm:text-left">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={profileData.contactNumber}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }))
                }
                placeholder="Enter your contact number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-date">Join Date</Label>
              <Input id="join-date" value={profileData.joinDate} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-updated">Account Updated</Label>
              <Input
                id="account-updated"
                value={profileData.accountUpdated}
                disabled
              />
            </div>
          </div>

          {/* Personal Address with Map */}
          <GoogleMapComponent
            onLocationSelect={(addr) =>
              setProfileData((prev) => ({ ...prev, address: addr }))
            }
            initialAddress={profileData.address}
            containerStyle={{ width: "100%", height: "400px", borderRadius: 12 }}
          />
          {/* Submit */}
          <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? <span className="flex items-center gap-2">
              Saving
              <Loader2 className="h-4 w-4 animate-spin" />
            </span> : "Save Personal Information"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
