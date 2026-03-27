// services/orders.api.ts
export type OrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";
export type PaymentMethod = "cash" | "card" | "online";

export interface BagItem {
  _id: string;
  itemName: string;
  image: string;
  price: number;
  qty: number;
  totalAmount: number;
  toppings: any[];
  note?: string;
}

export interface OrderItem {
  _id: string;
  orderId: string;
  userId: string;
  items: BagItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  note?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface FetchOrdersParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: string; // optional filter by status
}

// ---------------- Fetch Orders with Pagination ----------------
export const fetchOrdersApi = async ({
  userId,
  page = 1,
  limit = 10,
  status,
}: FetchOrdersParams): Promise<{
  orders: OrderItem[];
  totalPages: number;
  currentPage: number;
  totalOrders: number;
}> => {
  if (!userId) return { orders: [], totalPages: 0, currentPage: 1, totalOrders: 0 };

  try {
    const queryParams = new URLSearchParams({
      userId,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) queryParams.append("status", status);

    const res = await fetch(`/api/orders?${queryParams.toString()}`);
    const data = await res.json();

    if (!res.ok) return { orders: [], totalPages: 0, currentPage: page, totalOrders: 0 };

    return {
      orders: data.orders || [],
      totalPages: data.pagination.totalPages || 1,
      currentPage: data.pagination.currentPage || page,
      totalOrders: data.pagination.totalOrders || 0,
    };
  } catch (err) {
    console.error("fetchOrdersApi error:", err);
    return { orders: [], totalPages: 0, currentPage: page, totalOrders: 0 };
  }
};

// ---------------- Cancel Order ----------------
export const cancelOrderApi = async (orderId: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("cancelOrderApi error:", data.error || "Failed to cancel order");
      return false;
    }

    return true;
  } catch (err) {
    console.error("cancelOrderApi error:", err);
    return false;
  }
};

// ---------------- Add Order ----------------
export const addToOrderApi = async (
  userId: string,
  address: string,
  phone: string,
  paymentMethod: PaymentMethod,
  note: string
): Promise<OrderItem | null> => {
  if (!userId) return null;

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, address, phone, paymentMethod, note }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to place order");

    return data.order;
  } catch (err) {
    console.error("addToOrderApi error:", err);
    return null;
  }
};