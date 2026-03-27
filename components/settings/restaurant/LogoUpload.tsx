// components/RestaurantLogoUpload.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, ImageIcon, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { 
  logoApi, 
  Logo, 
  ACCEPTED_IMAGE_TYPES,
  validateImage,
  fileToBase64 
} from "@/services/logo.api";

// Utility function for conditional classes
const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};

export function RestaurantLogoUpload() {
  const [logo, setLogo] = useState<Logo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch existing logo on mount
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setIsLoading(true);
        const data = await logoApi.get();
        setLogo(data);
        if (data?.url) {
          setPreviewUrl(data.url);
        }
      } catch (error) {
        console.error("Failed to fetch logo", error);
        toast.error(error instanceof Error ? error.message : "Failed to fetch logo");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogo();
  }, []);

  // Handle file selection and validation
  const processFile = async (file: File) => {
    // Validate file
    try {
      validateImage(file);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      return false;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    return true;
  };

  // Handle file upload
  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const base64 = await fileToBase64(file);
        const exists = logo !== null;
        const uploadedLogo = await logoApi.uploadOrUpdate(base64, exists);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setLogo(uploadedLogo);
        
        toast.success(
          exists ? "Logo updated successfully" : "Logo uploaded successfully",
          {
            icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          }
        );

        // Reset progress after showing completion
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
        
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Upload failed", {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        });
        // Revert preview on error
        setPreviewUrl(logo?.url || null);
      } finally {
        setIsUploading(false);
      }
    },
    [logo]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isValid = await processFile(file);
      if (isValid) {
        await handleUpload(file);
      }
      
      // Reset input
      e.target.value = "";
    },
    [handleUpload]
  );

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const isValid = await processFile(file);
      if (isValid) {
        await handleUpload(file);
      }
    },
    [handleUpload]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!logo) return;

    setIsUploading(true);
    try {
      await logoApi.delete();
      setLogo(null);
      setPreviewUrl(null);
      toast.success("Logo deleted successfully", {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Delete failed", {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setIsUploading(false);
    }
  }, [logo]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-6 border rounded-lg bg-card">
        <Label className="text-base font-semibold">Restaurant Logo</Label>
        <div className="flex items-center justify-center h-40">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading logo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      {/* Header */}
      <div className="space-y-1">
        <Label className="text-base font-semibold">Restaurant Logo</Label>
        <p className="text-sm text-muted-foreground">
          Upload your restaurant logo. This will be displayed in the header and on marketing materials.
        </p>
      </div>

      {/* Main content - Simplified layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Logo preview and upload area */}
        <div className="flex-1 space-y-4">
          {/* Drag and drop area */}
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed transition-all",
              dragActive ? "border-primary bg-primary/5" : "border-border",
              isUploading ? "opacity-50 pointer-events-none" : "hover:border-primary/50 hover:bg-secondary/5"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Logo display */}
            <div className="flex flex-col items-center justify-center p-8">
              <div className="relative w-40 h-40 mb-4">
                {previewUrl ? (
                  <>
                    <Image
                      src={previewUrl}
                      alt="Restaurant Logo"
                      fill
                      className={cn(
                        "object-cover rounded-xl shadow-lg transition-all",
                        isUploading && "opacity-50"
                      )}
                      sizes="160px"
                      priority
                    />
                    {/* Upload progress overlay */}
                    {isUploading && uploadProgress > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                        <div className="text-center">
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-white/20"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 28}`}
                                strokeDashoffset={2 * Math.PI * 28 * (1 - uploadProgress / 100)}
                                className="text-white transition-all duration-300"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                              {uploadProgress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-xl bg-secondary/10">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Upload prompt */}
              {!previewUrl && !isUploading && (
                <>
                  <p className="text-sm font-medium mb-1">Drop your logo here</p>
                  <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
                </>
              )}

              {/* File input (hidden) */}
              <Input
                id="restaurant-logo"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="restaurant-logo"
                  className={cn(
                    "cursor-pointer",
                    isUploading && "pointer-events-none"
                  )}
                >
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "shadow-sm hover:shadow-md",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}>
                    <Upload className="h-4 w-4" />
                    <span>
                      {isUploading 
                        ? "Uploading..." 
                        : (logo ? "Change Logo" : "Upload Logo")
                      }
                    </span>
                  </div>
                </Label>

                {logo && !isUploading && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-sm hover:shadow-md text-sm font-medium"
                    aria-label="Delete logo"
                  >
                    <X className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* File requirements - Simplified */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Recommended size: 200x200px (square)</p>
            <p>• Maximum file size: 5MB</p>
            <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </div>

      </div>
    </div>
  );
}