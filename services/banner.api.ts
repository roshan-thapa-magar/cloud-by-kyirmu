// services/banner.api.ts
import { toast } from "sonner";

export interface Banner {
  _id: string;
  url: string;
  order: number;
}

export interface BannerPayload {
  id: string;
  order: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const MAX_BANNERS = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// Helper functions
export const validateImage = (file: File): boolean => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    toast.error(`${file.name} is not a supported image type.`);
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.error(`${file.name} exceeds 5MB.`);
    return false;
  }
  return true;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
};

// API functions
export const bannerApi = {
  // Get all banners
  async getAll(): Promise<Banner[]> {
    const res = await fetch("/api/banners");
    const data: ApiResponse<Banner[]> = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch banners");
    }
    
    return data.data;
  },

  // Upload new banner
  async upload(imageBase64: string): Promise<Banner> {
    const res = await fetch("/api/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });
    
    const data: ApiResponse<Banner> = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to upload banner");
    }
    
    return data.data;
  },

  // Update banner
  async update(id: string, imageBase64: string): Promise<Banner> {
    const res = await fetch(`/api/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });
    
    const data: ApiResponse<Banner> = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to update banner");
    }
    
    return data.data;
  },

  // Delete banner
  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/banners/${id}`, {
      method: "DELETE",
    });
    
    const data: ApiResponse<null> = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to delete banner");
    }
  },

  // Reorder banners
  async reorder(banners: BannerPayload[]): Promise<Banner[]> {
    const res = await fetch("/api/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banners }),
    });
    
    const data: ApiResponse<Banner[]> = await res.json();
    
    if (!data.success) {
      throw new Error(data.message || "Failed to update banner order");
    }
    
    return data.data;
  }
};