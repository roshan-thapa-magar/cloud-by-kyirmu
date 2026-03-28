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
  const { user, fetchUser, updateUser, updateUserImage, loading, isUploadingImage: globalIsUploadingImage } = useUser();
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
  const [isSaving, setIsSaving] = useState(false);
  const [localImageUploading, setLocalImageUploading] = useState(false);

  // Use global uploading state or local state
  const isUploadingImage = globalIsUploadingImage || localImageUploading;

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileData((prev) => ({
        ...prev,
        profileImage: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);

    // Set local uploading state
    setLocalImageUploading(true);

    try {
      // Convert to base64 for the API
      const base64Image = await new Promise<string>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(file);
      });

      const result = await updateUserImage(userId, base64Image);
      
      if (result.success) {
        // toast.success("Profile picture updated successfully");
        // Update the profile image with the Cloudinary URL
        if (result.image) {
          setProfileData((prev) => ({
            ...prev,
            profileImage: result.image!,
          }));
        }
      } else {
        toast.error(result.message || "Failed to update profile picture");
        // Revert to previous image if upload failed
        setProfileData((prev) => ({
          ...prev,
          profileImage: user?.image || "https://res.cloudinary.com/dzbtzumsd/image/upload/v1758364107/users/ew23jqr9zvvjmsiialpk.jpg",
        }));
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to update profile picture");
      // Revert to previous image
      setProfileData((prev) => ({
        ...prev,
        profileImage: user?.image || "https://res.cloudinary.com/dzbtzumsd/image/upload/v1758364107/users/ew23jqr9zvvjmsiialpk.jpg",
      }));
    } finally {
      setLocalImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User not loaded yet");
      return;
    }

    setIsSaving(true);
    
    try {
      // Only update text fields (name, address, phone)
      // This runs independently from image upload
      const { success, message } = await updateUser(userId, {
        name: profileData.name,
        address: profileData.address,
        phone: profileData.contactNumber,
      });

      if (success) {
        toast.success(message || "Profile updated successfully!");
      } else {
        toast.error(message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Form fields should only be disabled if they are being saved
  // Image upload should NOT disable form fields
  const isFormDisabled = isSaving;
  const isSubmitDisabled = isSaving; // Image upload doesn't block submit

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
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={profileData.profileImage} alt="Profile" />
                <AvatarFallback>
                  {profileData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="w-full sm:w-auto">
              <Label htmlFor="profile-image" className="cursor-pointer">
                <div className="flex items-center justify-center sm:justify-start space-x-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>{isUploadingImage ? "Uploading..." : "Change Photo"}</span>
                </div>
              </Label>
              <Input
                id="profile-image"
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
              <p className="text-sm text-muted-foreground mt-1 text-center sm:text-left">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          {/* Form Fields - Not disabled during image upload */}
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
                disabled={isFormDisabled}
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
                disabled={isFormDisabled}
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

          {/* Personal Address with Map - Not disabled during image upload */}
          <GoogleMapComponent
            onLocationSelect={(addr) =>
              setProfileData((prev) => ({ ...prev, address: addr }))
            }
            initialAddress={profileData.address}
            containerStyle={{ width: "100%", height: "400px", borderRadius: 12 }}
          />
          
          {/* Submit Button - Only disabled during save, not during image upload */}
          <Button 
            type="submit" 
            className="w-full sm:w-auto" 
            disabled={isSubmitDisabled}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Personal Information
              </>
            )}
          </Button>

          {/* Optional: Show status messages */}
          {isUploadingImage && !isSaving && (
            <p className="text-sm text-blue-600 mt-2">
              Uploading profile picture... You can continue editing other fields.
            </p>
          )}
          {isSaving && !isUploadingImage && (
            <p className="text-sm text-blue-600 mt-2">
              Saving your changes...
            </p>
          )}
          {isUploadingImage && isSaving && (
            <p className="text-sm text-blue-600 mt-2">
              Uploading profile picture and saving changes...
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}