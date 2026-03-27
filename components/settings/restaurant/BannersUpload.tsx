// components/RestaurantBannersUpload.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2, ArrowUp, ArrowDown, Edit2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  bannerApi, 
  Banner, 
  MAX_BANNERS, 
  ACCEPTED_IMAGE_TYPES,
  validateImage,
  fileToBase64 
} from "@/services/banner.api";

export function RestaurantBannersUpload() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await bannerApi.getAll();
      // Sort by order to ensure correct display
      const sortedData = [...data].sort((a, b) => a.order - b.order);
      setBanners(sortedData);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch banners");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      
      if (banners.length + files.length > MAX_BANNERS) {
        toast.error(`You can only upload up to ${MAX_BANNERS} banners.`);
        e.target.value = "";
        return;
      }

      setIsUploading(true);
      try {
        const uploaded: Banner[] = [];
        for (const file of files) {
          if (!validateImage(file)) continue;
          const base64 = await fileToBase64(file);
          const banner = await bannerApi.upload(base64);
          uploaded.push(banner);
        }
        
        setBanners(prev => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} banner(s) uploaded successfully`);
      } catch (err: any) {
        toast.error(err.message || "Failed to upload banners");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [banners.length]
  );

  const removeBanner = async (index: number) => {
    setLoadingItems(prev => new Set(prev).add(index));
    
    const banner = banners[index];
    try {
      await bannerApi.delete(banner._id);
      setBanners(prev => prev.filter((_, i) => i !== index));
      toast.success("Banner removed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove banner");
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const updateBanner = async (index: number, file: File) => {
    if (!validateImage(file)) return;
    
    setLoadingItems(prev => new Set(prev).add(index));
    
    const banner = banners[index];
    try {
      const base64 = await fileToBase64(file);
      const updated = await bannerApi.update(banner._id, base64);
      
      setBanners(prev => {
        const newBanners = [...prev];
        newBanners[index] = updated;
        return newBanners;
      });
      
      toast.success("Banner updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update banner");
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const moveBanner = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    setLoadingItems(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      newSet.add(newIndex);
      return newSet;
    });

    const newBanners = [...banners];
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];
    
    // Update local order immediately for UI
    newBanners.forEach((b, i) => {
      b.order = i + 1;
    });
    setBanners(newBanners);

    try {
      const payload = newBanners.map((b, i) => ({ id: b._id, order: i + 1 }));
      await bannerApi.reorder(payload);
      toast.success(`Banner moved ${direction}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
      await fetchBanners(); // Revert on error
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        newSet.delete(newIndex);
        return newSet;
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newBanners = [...banners];
    const [draggedBanner] = newBanners.splice(draggedItem, 1);
    newBanners.splice(index, 0, draggedBanner);
    
    // Update order numbers
    newBanners.forEach((b, i) => {
      b.order = i + 1;
    });
    
    setBanners(newBanners);
    setDraggedItem(index);
  };

  const handleDragEnd = async () => {
    if (draggedItem !== null) {
      const allIndices = new Set(banners.map((_, i) => i));
      setLoadingItems(allIndices);
      
      try {
        const payload = banners.map((b, i) => ({ id: b._id, order: i + 1 }));
        await bannerApi.reorder(payload);
        toast.success("Banner order updated");
      } catch (err: any) {
        toast.error(err.message || "Failed to update order");
        await fetchBanners(); // Revert to original order
      } finally {
        setLoadingItems(new Set());
        setDraggedItem(null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Label className="text-lg font-semibold">
            Restaurant Banners
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Upload up to {MAX_BANNERS} banners. Recommended size: 1920x1080px or 16:9 ratio.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm px-3 py-1.5 bg-secondary rounded-full">
            <span className="font-medium">{banners.length}</span>
            <span className="text-muted-foreground">/{MAX_BANNERS}</span>
          </div>
          
          {banners.length < MAX_BANNERS && (
            <Label htmlFor="restaurant-banners" className="cursor-pointer">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "shadow-sm hover:shadow-md",
                (isUploading || loadingItems.size > 0) && "opacity-50 cursor-not-allowed"
              )}>
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isUploading ? "Uploading..." : "Add Banners"}
                </span>
              </div>
            </Label>
          )}
        </div>
      </div>

      {/* Hidden Input */}
      <Input
        id="restaurant-banners"
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleUpload}
        disabled={isUploading || banners.length >= MAX_BANNERS || loadingItems.size > 0}
      />

      {/* Banners Grid */}
      {banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {banners.map((banner, index) => {
            const isLoading = loadingItems.has(index);
            
            return (
              <div
                key={banner._id}
                draggable={!isUploading && loadingItems.size === 0}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "relative group aspect-video rounded-xl overflow-hidden",
                  "border-2 transition-all duration-200",
                  draggedItem === index 
                    ? "border-primary scale-105 shadow-xl rotate-1" 
                    : "border-transparent hover:border-primary/50",
                  isLoading ? "cursor-wait" : "cursor-move",
                  "hover:shadow-lg"
                )}
              >
                <Image
                  src={banner.url}
                  alt={`Banner ${index + 1}`}
                  fill
                  className={cn(
                    "object-cover transition-all",
                    isLoading && "opacity-50"
                  )}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                <div className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity",
                  isLoading ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                )} />

                {!isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/40 backdrop-blur-[2px]">
                    <button
                      onClick={() => removeBanner(index)}
                      className="bg-red-500 text-white rounded-full p-2.5 hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                      title="Delete banner"
                      disabled={loadingItems.size > 0}
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ACCEPTED_IMAGE_TYPES.join(",");
                        input.onchange = (e: any) => {
                          const file = e.target.files[0];
                          if (file) updateBanner(index, file);
                        };
                        input.click();
                      }}
                      className="bg-yellow-500 text-white rounded-full p-2.5 hover:bg-yellow-600 hover:scale-110 transition-all shadow-lg"
                      title="Replace banner"
                      disabled={loadingItems.size > 0}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <div className="flex flex-col gap-1 ml-1">
                      {index > 0 && (
                        <button
                          onClick={() => moveBanner(index, "up")}
                          className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 hover:scale-110 transition-all shadow-lg"
                          title="Move up"
                          disabled={loadingItems.size > 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {index < banners.length - 1 && (
                        <button
                          onClick={() => moveBanner(index, "down")}
                          className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 hover:scale-110 transition-all shadow-lg"
                          title="Move down"
                          disabled={loadingItems.size > 0}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium">
                    Order: {banner.order}
                  </span>
                  {draggedItem === index && (
                    <span className="bg-primary text-white px-2.5 py-1 rounded-full text-xs font-medium animate-pulse">
                      Dragging
                    </span>
                  )}
                </div>

                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white/10 rounded-full p-3">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative w-full aspect-video border-2 border-dashed rounded-xl bg-secondary/5 hover:bg-secondary/10 transition-colors">
          <Label
            htmlFor="restaurant-banners"
            className="flex flex-col items-center justify-center h-full cursor-pointer group"
          >
            <div className="rounded-full bg-primary/10 p-4 mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <span className="text-lg font-medium text-foreground mb-1">
              No banners yet
            </span>
            <span className="text-sm text-muted-foreground text-center max-w-sm px-4">
              Click to upload your first banner. Images will be displayed in the restaurant gallery.
            </span>
            <span className="text-xs text-muted-foreground mt-4">
              Supports: JPG, PNG, GIF, WebP (Max 5MB)
            </span>
          </Label>
        </div>
      )}
    </div>
  );
}