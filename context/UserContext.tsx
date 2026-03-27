"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchUserResponse { success: boolean; message?: string; }
interface UpdateUserResponse { success: boolean; message?: string; user?: User; }
interface DeleteUserResponse { success: boolean; message?: string; }
interface UserContextType {
  user: User | null;
  loading: boolean;
  fetchUser: (id: string) => Promise<FetchUserResponse>;
  updateUser: (
    id: string,
    data: { name?: string; image?: string; phone?: string; address?: string }
  ) => Promise<UpdateUserResponse>;
  deleteUser: (id: string) => Promise<DeleteUserResponse>;
  fetchUserByRole: (role: string) => Promise<FetchUserResponse & { user?: User }>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  // ---- API METHODS ----
  const fetchUser = useCallback(async (id: string): Promise<FetchUserResponse> => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      if (res.ok) {
        if (isMounted.current) {
          setUser(data);
        }
        return { success: true };
      } else {
        return { success: false, message: data.message || "Failed to fetch user" };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : String(error) 
      };
    } finally { 
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const updateUser = useCallback(
    async (id: string, updateData: { name?: string; image?: string; phone?: string; address?: string }): Promise<UpdateUserResponse> => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        const data = await res.json();
        if (res.ok) {
          if (isMounted.current) {
            setUser(data.user);
          }
          toast.success(data.message || "User updated successfully");
          return { success: true, message: data.message, user: data.user };
        } else {
          toast.error(data.message || "Failed to update user");
          return { success: false, message: data.message || "Failed to update user" };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      } finally { 
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }, []
  );

  const deleteUser = useCallback(async (id: string): Promise<DeleteUserResponse> => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        if (isMounted.current) {
          setUser(null);
        }
        toast.success(data.message || "User deleted successfully");
        return { success: true, message: data.message };
      } else {
        toast.error(data.message || "Failed to delete user");
        return { success: false, message: data.message || "Failed to delete user" };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally { 
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchUserByRole = useCallback(async (role: string): Promise<FetchUserResponse & { user?: User }> => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?role=${role}`);
      const data = await res.json();
      if (res.ok && data.length > 0) {
        const owner = data[0];
        if (isMounted.current) {
          setUser(owner);
        }
        return { success: true, user: owner };
      } else {
        return { success: false, message: "No user found with this role" };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : String(error) 
      };
    } finally { 
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // ---- PUSHER REAL-TIME UPDATES ----
  useEffect(() => {
    isMounted.current = true;
    
    const pusher = getPusherClient();
    const channel = pusher.subscribe('users');

    // Handle user update
    const handleUserUpdated = (updatedUser: User) => {
      if (isMounted.current) {
        setUser((currentUser) => {
          if (currentUser?._id === updatedUser._id) {
            toast.info("Your profile has been updated");
            return updatedUser;
          }
          return currentUser;
        });
      }
    };

    // Handle user image update
    const handleUserImageUpdated = ({ _id, image, user }: { _id: string; image: string; user?: User }) => {
      if (isMounted.current) {
        setUser((currentUser) => {
          if (currentUser?._id === _id) {
            toast.success("Profile picture updated");
            return { ...currentUser, image };
          }
          return currentUser;
        });
      }
    };

    // Handle user deletion
    const handleUserDeleted = ({ _id, userId }: { _id: string; userId?: string }) => {
      const deletedUserId = _id || userId;
      if (isMounted.current) {
        setUser((currentUser) => {
          if (currentUser?._id === deletedUserId) {
            toast.warning("Your account has been deleted");
            return null;
          }
          return currentUser;
        });
      }
    };

    // Handle new user creation (optional, for admin contexts)
    const handleUserCreated = (newUser: User) => {
      // You might want to handle this if you have an admin panel
      console.log("New user created:", newUser);
    };

    // Bind events
    channel.bind('user-updated', handleUserUpdated);
    channel.bind('user-image-updated', handleUserImageUpdated);
    channel.bind('user-deleted', handleUserDeleted);
    channel.bind('user-created', handleUserCreated);

    // Cleanup
    return () => {
      isMounted.current = false;
      channel.unbind('user-updated', handleUserUpdated);
      channel.unbind('user-image-updated', handleUserImageUpdated);
      channel.unbind('user-deleted', handleUserDeleted);
      channel.unbind('user-created', handleUserCreated);
      pusher.unsubscribe('users');
    };
  }, []); // Remove dependency on user?._id to avoid re-running effect

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        loading, 
        fetchUser, 
        updateUser, 
        deleteUser, 
        fetchUserByRole,
        setUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
}