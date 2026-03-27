// services/logo.api.ts
export interface Logo {
  _id?: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// Helper functions
export const validateImage = (file: File): boolean => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`${file.name} is not a supported image type. Supported formats: JPG, PNG, GIF, WebP`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name} exceeds 5MB. Please choose a smaller file.`);
  }
  return true;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error("Failed to read file"));
  });
};

// API functions
export const logoApi = {
  // Get restaurant logo
  async get(): Promise<Logo | null> {
    try {
      const res = await fetch("/api/restaurant-logo");
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: ApiResponse<Logo> = await res.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch logo", error);
      throw new Error("Failed to fetch logo. Please check your connection.");
    }
  },

  // Upload new logo (POST)
  async upload(imageBase64: string): Promise<Logo> {
    try {
      const res = await fetch("/api/restaurant-logo", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: ApiResponse<Logo> = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Upload failed");
      }
      
      return data.data;
    } catch (error) {
      console.error("Upload failed", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Upload failed. Please try again.");
    }
  },

  // Update existing logo (PUT)
  async update(imageBase64: string): Promise<Logo> {
    try {
      const res = await fetch("/api/restaurant-logo", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: ApiResponse<Logo> = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Update failed");
      }
      
      return data.data;
    } catch (error) {
      console.error("Update failed", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Update failed. Please try again.");
    }
  },

  // Delete logo
  async delete(): Promise<void> {
    try {
      const res = await fetch("/api/restaurant-logo", { 
        method: "DELETE" 
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: ApiResponse<null> = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Delete failed", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Delete failed. Please try again.");
    }
  },

  // Upload or update based on existence
  async uploadOrUpdate(imageBase64: string, exists: boolean): Promise<Logo> {
    return exists ? this.update(imageBase64) : this.upload(imageBase64);
  },

  // Check if logo exists
  async exists(): Promise<boolean> {
    try {
      const logo = await this.get();
      return logo !== null;
    } catch {
      return false;
    }
  },

  // Upload with progress simulation
  async uploadWithProgress(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Logo> {
    // Validate file first
    try {
      validateImage(file);
    } catch (error) {
      throw error;
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          
          // Simulate progress (since fetch doesn't provide upload progress)
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            onProgress?.(Math.min(progress, 90));
            if (progress >= 90) clearInterval(interval);
          }, 100);
          
          // Check if logo exists to determine method
          const exists = await this.exists();
          const logo = await this.uploadOrUpdate(base64, exists);
          
          clearInterval(interval);
          onProgress?.(100);
          resolve(logo);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }
};