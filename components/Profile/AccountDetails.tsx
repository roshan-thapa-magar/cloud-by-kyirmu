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
  const { user, fetchUser, updateUser, loading, deleteUser } = useUser();
  const userId = session?.user?._id;
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Local state for form
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [hovering, setHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  // Fetch user when session ID is available
  useEffect(() => {
    if (userId) fetchUser(userId);
  }, [userId]);

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
    const result = await updateUser(userId, { name: fullName, phone: contactNumber, image: profileImage });
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    const result = await deleteUser(userId);

    if (result.success) {
      await signOut({ redirect: false }); // prevent default redirect
      router.push("/"); // now this will work
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsDeleteOpen(false); // Close dialog
  };

  // Handle profile image change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  return (
    <>
      <span className="text-2xl font-extrabold">Account Details</span>
      <p className='font-bold mt-2'>Personal Information</p>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-4">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Image */}
          <div
            className="relative inline-block"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            <Image
              alt="Profile Picture"
              src={profileImage || "/images/image.png"}
              width={96}
              height={96}
              className="rounded-full w-24 h-24 md:w-32 md:h-32 border-2 border-gray-300 object-cover"
            />

            {/* Pencil Icon on Hover */}
            <button
              onClick={handleImageClick}
              className={`absolute inset-0 cursor-pointer rounded-full bg-black/50 flex items-center justify-center transition-opacity duration-200 ${hovering ? 'opacity-100' : 'md:opacity-0'}`}
              title="Change profile picture"
            >
              <Pencil className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              aria-label="Upload profile picture"
            />
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
              placeholder="Email"
            />
          </div>

          {/* Update Button */}
          <Button variant="default" className="w-full cursor-pointer" onClick={handleUpdate} disabled={loading}>
            {loading ? <span className="flex items-center gap-2">
              Saving
              <Loader2 className="h-4 w-4 animate-spin" />
            </span> : "Update Details"}
          </Button>
        </div>

        {/* Right Column */}
        <div className="flex items-start md:items-start md:justify-end">
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}
            className="w-full md:w-auto">
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