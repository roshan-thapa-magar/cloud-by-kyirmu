"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { getPusherClient } from "@/lib/pusher-client";

// ---- TYPES ----
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

interface FetchUserResponse {
  success: boolean;
  message?: string;
}

interface UpdateUserResponse {
  success: boolean;
  message?: string;
  user?: User;
}

interface DeleteUserResponse {
  success: boolean;
  message?: string;
}

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

// ---- CONTEXT ----
const UserContext = createContext<UserContextType | undefined>(undefined);

// ---- PROVIDER ----
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  // ---- FETCH USER ----
  const fetchUser = useCallback(async (id: string): Promise<FetchUserResponse> => {
    try {
      setLoading(true);

      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message };
      }

      // ✅ FIX: correct response
      const userData = data.user || data;

      if (isMounted.current) {
        setUser(userData);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  // ---- UPDATE USER ----
  const updateUser = useCallback(
    async (
      id: string,
      updateData: { name?: string; image?: string; phone?: string; address?: string }
    ): Promise<UpdateUserResponse> => {
      try {
        setLoading(true);

        const res = await fetch(`/api/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        const data = await res.json();

        if (!res.ok) {
          return { success: false, message: data.message };
        }

        if (isMounted.current) {
          setUser(data.user);
        }

        return { success: true, message: data.message, user: data.user };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    []
  );

  // ---- DELETE USER ----
  const deleteUser = useCallback(async (id: string): Promise<DeleteUserResponse> => {
    try {
      setLoading(true);

      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message };
      }

      if (isMounted.current) {
        setUser(null);
      }

      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  // ---- FETCH BY ROLE ----
  const fetchUserByRole = useCallback(
    async (role: string): Promise<FetchUserResponse & { user?: User }> => {
      try {
        setLoading(true);

        const res = await fetch(`/api/users?role=${role}`);
        const data = await res.json();

        if (!res.ok || !data.length) {
          return { success: false, message: "No user found" };
        }

        const userData = data[0];

        if (isMounted.current) {
          setUser(userData);
        }

        return { success: true, user: userData };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        };
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    []
  );

  // ---- PUSHER (SAFE VERSION) ----
  useEffect(() => {
    if (typeof window === "undefined") return;

    isMounted.current = true;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("users");

    const handleUserUpdated = (updatedUser: User) => {
      setUser((prev) => (prev?._id === updatedUser._id ? updatedUser : prev));
    };

    const handleUserImageUpdated = ({ _id, image }: { _id: string; image: string }) => {
      setUser((prev) =>
        prev?._id === _id ? { ...prev, image } : prev
      );
    };

    const handleUserDeleted = ({ _id }: { _id: string }) => {
      setUser((prev) => (prev?._id === _id ? null : prev));
    };

    // Bind events
    channel.bind("user-updated", handleUserUpdated);
    channel.bind("user-image-updated", handleUserImageUpdated);
    channel.bind("user-deleted", handleUserDeleted);

    return () => {
      isMounted.current = false;

      channel.unbind("user-updated", handleUserUpdated);
      channel.unbind("user-image-updated", handleUserImageUpdated);
      channel.unbind("user-deleted", handleUserDeleted);

      pusher.unsubscribe("users");
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        fetchUser,
        updateUser,
        deleteUser,
        fetchUserByRole,
        setUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ---- HOOK ----
export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside UserProvider");
  return context;
}