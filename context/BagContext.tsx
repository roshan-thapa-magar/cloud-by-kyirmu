"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SuccessPopup } from "@/components/SuccessPopup";
import { useUser } from "@/context/UserContext";

interface BagItem {
  _id: string;
  itemName: string;
  image: string;
  price: number;
  qty: number;
  totalAmount: number;
  toppings: any[];
  note?: string;
}

interface BagContextType {
  bagItems: BagItem[];
  loading: boolean;
  orderLoading: boolean;
  subtotal: number;
  itemCount: number;
  fetchBag: () => Promise<void>;
  addToBag: (payload: any) => Promise<boolean>;
  addToOrder: (address: string, phone: string, paymentMethod: string, note: string) => Promise<boolean>;
  updateQuantity: (bagId: string, newQty: number) => Promise<void>;
  removeItem: (bagId: string) => Promise<void>;
  removeToppingItem: (bagId: string, toppingItemId: string) => Promise<void>;
  removeToppingGroup: (bagId: string, toppingGroupId: string) => Promise<void>;
  updateItemNote: (bagId: string, note: string) => Promise<void>;
  updateSelectedTopping: (
    bagId: string,
    toppingTitle: string,
    selectedItem: string
  ) => Promise<void>;
}

const BagContext = createContext<BagContextType | undefined>(undefined);

export function BagProvider({ children }: { children: ReactNode }) {
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?._id;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const showSuccess = (msg: string) => setSuccessMessage(msg);
  const { user } = useUser();
  const [data, setData] = useState<any>(null);

  // ---------------- Fetch Bag ----------------
  const fetchBag = useCallback(async () => {
    if (!userId) {
      setBagItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/bag?userId=${userId}`);
      const data = await res.json();
      setBagItems(data.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bag");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ---------------- Add to Order ----------------
  const addToOrder = async (
    address: string,
    phone: string,
    paymentMethod: string,
    note: string
  ) => {
    if (!userId) {
      toast.error("Please log in");
      return false;
    }

    try {
      setOrderLoading(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, address, phone, paymentMethod, note }),
      });

      const data = await res.json();
      setData(data.order);
      if (!res.ok) {
        toast.error(data.error || "Failed to place order");
        return false;
      }

      showSuccess("Order placed successfully!");
      await fetchBag(); // clear bag
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order");
      return false;
    } finally {
      setOrderLoading(false);
    }
  };

  // ---------------- Add / Update / Remove Bag ----------------
  const addToBag = async (payload: any) => {
    if (!userId) return false;

    try {
      const res = await fetch("/api/bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add to bag");
        return false;
      }

      toast.success("Added to bag successfully!");
      setData(data.order);
      await fetchBag();
      return true;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add to bag");
      return false;
    }
  };

  const updateQuantity = async (bagId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      const res = await fetch(`/api/bag/${bagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: newQty }),
      });
      if (!res.ok) throw new Error();
      await fetchBag();
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (bagId: string) => {
    try {
      const res = await fetch(`/api/bag/${bagId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchBag();
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const removeToppingItem = async (bagId: string, toppingItemId: string) => {
    try {
      const res = await fetch(`/api/bag/${bagId}/item/${toppingItemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchBag();
    } catch {
      toast.error("Failed to remove topping");
    }
  };

  const removeToppingGroup = async (bagId: string, toppingGroupId: string) => {
    try {
      const res = await fetch(`/api/bag/${bagId}/group/${toppingGroupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchBag();
    } catch {
      toast.error("Failed to remove topping group");
    }
  };

  const updateItemNote = async (bagId: string, note: string) => {
    setBagItems(prev => prev.map(item => (item._id === bagId ? { ...item, note } : item)));
    await fetch(`/api/bag/${bagId}/note`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
  };

  const updateSelectedTopping = async (
    bagId: string,
    toppingTitle: string,
    selectedItem: string
  ) => {
    try {
      const res = await fetch(`/api/bag/${bagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toppingTitle, selectedItem }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update topping");
      await fetchBag();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update topping");
    }
  };

  useEffect(() => {
    fetchBag();
  }, [fetchBag]);

  return (
    <BagContext.Provider value={{
      bagItems,
      loading,
      orderLoading,
      subtotal: bagItems.reduce((total, i) => total + i.totalAmount, 0),
      itemCount: bagItems.length,
      fetchBag,
      addToBag,
      addToOrder,
      updateQuantity,
      removeItem,
      removeToppingItem,
      removeToppingGroup,
      updateItemNote,
      updateSelectedTopping,
    }}>
      {children}
      {successMessage && (
        <SuccessPopup
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          customerName={user?.name}
          orderTotal={data?.totalAmount}
          orderId={data?.orderId}
        />
      )}
    </BagContext.Provider>
  );
}

export function useBag() {
  const context = useContext(BagContext);
  if (!context) throw new Error("useBag must be used within a BagProvider");
  return context;
}