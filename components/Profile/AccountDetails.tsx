'use client';
import { useEffect, useState, useRef } from "react";
import Image from 'next/image';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2, Pencil } from 'lucide-react';
import { useUser } from "@/context/UserContext";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import { useRouter } from "next/navigation";

export default function AccountDetails() {
  const { data: session } = useSession();
  const { user, fetchUser, updateUser, updateUserImage, loading, deleteUser } = useUser();
  const userId = session?.user?._id;
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Local state for form
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [hovering, setHovering] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch user when session ID is available
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  // Prefill form when user data is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setProfileImage(user.image);
      setContactNumber(user.phone || "");
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!userId) return;
    
    // Only update name and phone (text fields)
    const result = await updateUser(userId, { 
      name: fullName, 
      phone: contactNumber 
    });
    
    if (result.success) {
      toast.success(result.message || "Profile updated successfully");
    } else {
      toast.error(result.message || "Failed to update profile");
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    
    const result = await deleteUser(userId);

    if (result.success) {
      await signOut({ redirect: false });
      router.push("/");
      toast.success(result.message || "Account deleted successfully");
    } else {
      toast.error(result.message || "Failed to delete account");
    }
    setIsDeleteOpen(false);
  };

  // Handle profile image change
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
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

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      
      // Update local state immediately for better UX
      setProfileImage(base64Image);
      
      // Upload to server
      setIsUploadingImage(true);
      try {
        const result = await updateUserImage(userId, base64Image);
        
        if (result.success) {
          toast.success("Profile picture updated successfully");
        } else {
          toast.error(result.message || "Failed to update profile picture");
          // Revert local state if upload failed
          setProfileImage(user?.image);
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to update profile picture");
        setProfileImage(user?.image);
      } finally {
        setIsUploadingImage(false);
      }
    };
    
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setIsUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleImageClick = () => {
    if (!isUploadingImage) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <span className="text-2xl font-extrabold">Account Details</span>
      <p className='font-bold mt-2'>Personal Information</p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-4">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div
              className="relative inline-block"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              <div className="relative">
                <Image
                  alt="Profile Picture"
                  src={profileImage || "/images/image.png"}
                  width={96}
                  height={96}
                  className="rounded-full w-24 h-24 md:w-32 md:h-32 border-2 border-gray-300 object-cover"
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Pencil Icon on Hover */}
              <button
                onClick={handleImageClick}
                disabled={isUploadingImage}
                className={`absolute inset-0 cursor-pointer rounded-full bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
                  hovering && !isUploadingImage ? 'opacity-100' : 'md:opacity-0'
                }`}
                title="Change profile picture"
                type="button"
              >
                <Pencil className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
                aria-label="Upload profile picture"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click the pencil icon to change your profile picture (Max 5MB)
            </p>
          </div>

          {/* Full Name Input */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <Input
              id="fullName"
              className="mt-1"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          {/* Contact Number Input */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
              Contact Number
            </label>
            <Input
              id="contactNumber"
              className="mt-1"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter your contact number"
              disabled={loading}
            />
          </div>

          {/* Email Input (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              className="mt-1 bg-gray-100 cursor-not-allowed"
              value={user?.email || ""}
              readOnly
              disabled
              placeholder="Email"
            />
          </div>

          {/* Update Button */}
          <Button 
            variant="default" 
            className="w-full cursor-pointer" 
            onClick={handleUpdate} 
            disabled={loading || isUploadingImage}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : "Update Details"}
          </Button>
        </div>

        {/* Right Column */}
        <div className="flex items-start md:items-start md:justify-end">
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteOpen(true)}
            disabled={loading || isUploadingImage}
            className="w-full md:w-auto"
          >
            Remove My Account
          </Button>
        </div>

        {/* Delete Dialog */}
        <DeleteDialog
          isOpen={isDeleteOpen}
          isLoading={loading}
          title="Delete your account?"
          description="Deleting your account will permanently remove all your account details and your selected bag items. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      </div>
    </>
  );
}