// services/user.service.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
}

// Service to fetch owner (role is default)
export const fetchOwner = async (): Promise<User | null> => {
  try {
    const res = await fetch("/api/users?role=owner"); // role defaulted in API
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data: User[] = await res.json();
    if (!data.length) return null; // no owner found
    return data[0]; // return the first owner
  } catch (error) {
    console.error("Failed to fetch owner:", error);
    return null;
  }
};