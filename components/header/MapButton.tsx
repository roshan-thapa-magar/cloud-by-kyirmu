"use client";

import { MapPinnedIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";

export const MapButton: React.FC<{ size?: number }> = ({ size = 20 }) => {
  const { fetchUserByRole } = useUser();
  const [destination, setDestination] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    const loadOwner = async () => {
      const res = await fetchUserByRole("owner");

      if (res.success && res.user?.address) {
        const parts = res.user.address.split(",");

        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);

          if (!isNaN(lat) && !isNaN(lng)) {
            setDestination({ lat, lng });
          }
        }
      }
    };

    loadOwner();
  }, [fetchUserByRole]);

  const handleClick = () => {
    if (!destination) return;

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const originLat = position.coords.latitude;
        const originLng = position.coords.longitude;

        const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

        window.open(url, "_blank");
      },
      () => {
        // fallback if user denies location
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
        window.open(url, "_blank");
      }
    );
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 cursor-pointer"
    >
      <MapPinnedIcon size={size} />
      <span className="md:hidden">Location</span>
    </div>
  );
};