"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface Props {
  onLocationSelect?: (address: string) => void; // send lat,lng string
  initialAddress?: string; // default lat,lng string
  containerStyle?: React.CSSProperties; // custom map size
}

const defaultCenter = {
  lat: 27.7172, // Kathmandu
  lng: 85.324,
};

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];
export default function GoogleMapComponent({
  onLocationSelect,
  initialAddress,
  containerStyle = { width: "100%", height: "500px", borderRadius: "8px" },
}: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    // libraries: ["places"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<MapLocation>(defaultCenter);
  const [marker, setMarker] = useState<MapLocation>(defaultCenter);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // initialize geocoder
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  // set initial address if provided
  useEffect(() => {
    if (initialAddress && geocoderRef.current) {
      const [latStr, lngStr] = initialAddress.split(",");
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        let addressStr = initialAddress;
        if (status === "OK" && results && results[0]) {
          addressStr = results[0].formatted_address;
        }

        const loc = { lat, lng, address: addressStr };
        setCenter(loc);
        setMarker(loc);
        setSearchInput(addressStr);
        map?.panTo(loc);
      });
    }
  }, [initialAddress, map]);

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || !geocoderRef.current) return;

    setLoading(true);
    geocoderRef.current.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const res = results[0];
        const lat = res.geometry.location.lat();
        const lng = res.geometry.location.lng();

        const newLoc = { lat, lng, address: res.formatted_address };
        setCenter(newLoc);
        setMarker(newLoc);
        setSearchInput(res.formatted_address);

        onLocationSelect?.(`${lat},${lng}`);

        map?.panTo(newLoc);
        map?.setZoom(15);
      } else {
        alert("Location not found");
      }
      setLoading(false);
    });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation || !geocoderRef.current) return;
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        geocoderRef.current!.geocode({ location: { lat, lng } }, (results, status) => {
          let addressStr = `${lat},${lng}`;
          if (status === "OK" && results && results[0]) {
            addressStr = results[0].formatted_address;
          }

          const newLoc = { lat, lng, address: addressStr };
          setCenter(newLoc);
          setMarker(newLoc);
          setSearchInput(addressStr);

          onLocationSelect?.(`${lat},${lng}`);

          map?.panTo(newLoc);
          map?.setZoom(15);
          setLoading(false);
        });
      },
      () => {
        alert("Unable to get location");
        setLoading(false);
      }
    );
  };

  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !geocoderRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      let addressStr = `${lat},${lng}`;
      if (status === "OK" && results && results[0]) {
        addressStr = results[0].formatted_address;
      }

      const newLoc = { lat, lng, address: addressStr };
      setMarker(newLoc);
      setCenter(newLoc);
      setSearchInput(addressStr);

      onLocationSelect?.(`${lat},${lng}`);
    });
  };

  if (!isLoaded) {
    return (
      <div className="h-60 flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search location..."
          value={searchInput}
          readOnly
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(searchInput)}
        />
        <Button onClick={handleCurrentLocation} variant="outline">
          {loading ? <Loader2 className="animate-spin" /> : <MapPin />}
        </Button>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={onMapLoad}
      >
        <Marker
          position={marker}
          draggable
          onDragEnd={handleDragEnd}
          onClick={() => setShowInfo(true)}
        >
          {showInfo && (
            <InfoWindow onCloseClick={() => setShowInfo(false)}>
              <div>
                <p className="text-sm text-black">{marker.address}</p>
              </div>
            </InfoWindow>
          )}
        </Marker>
      </GoogleMap>
    </div>
  );
}