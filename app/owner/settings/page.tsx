"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Bell } from "lucide-react";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";
import { NotificationSettings } from "./notification-settings";
import { useUser } from "@/context/UserContext";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { user, fetchUser, loading } = useUser();
  const userId = session?.user?._id;
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4  px-4">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Avatar className="h-16 w-16 sm:h-24 sm:w-24">
            <AvatarImage
              src={user?.image || "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-867zNz6SjMBzPTPGDKxt31de7PPtFD.png"}
              alt="Profile"
            />
            <AvatarFallback> {user?.name?.charAt(0) ?? "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
              Account Settings
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
              disabled
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}