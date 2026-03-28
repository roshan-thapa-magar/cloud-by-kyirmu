"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { useSession } from "next-auth/react";
import GoogleMapComponent from "@/components/google-map-component";
import { Loader2 } from "lucide-react";

export default function AddressBook() {
  const { data: session } = useSession();
  const { user, fetchUser, updateUser,loading } = useUser();
  const userId = session?.user?._id;

  const [address, setAddress] = useState(""); // lat,lng string

  useEffect(() => {
    if (userId) fetchUser(userId);
  }, [userId]);

  useEffect(() => {
    if (user?.address) setAddress(user.address);
  }, [user]);

  const handleUpdate = async () => {
    if (!userId) return;
    if (!address.trim()) {
      toast.error("Please select address from map");
      return;
    }

    const result = await updateUser(userId, {
      address,
    });

    if (result.success) toast.success("Address updated successfully");
    else toast.error(result.message);
  };

  return (
    <div className="space-y-6">
      <GoogleMapComponent
        onLocationSelect={(addr) => setAddress(addr)}
        initialAddress={address} // load user's saved location
        containerStyle={{ width: "100%", height: "400px", borderRadius: 12 }}
      />

      <div className="p-3 border rounded text-sm bg-muted">
        <strong>Selected Lat/Lng:</strong>
        <p>{address || "No location selected"}</p>
      </div>

     <Button
        onClick={handleUpdate}
        className="w-full flex items-center justify-center gap-2"
        disabled={loading}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Saving..." : "Save Address"}
      </Button>
    </div>
  );
}