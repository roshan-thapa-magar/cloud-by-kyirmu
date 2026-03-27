// services/orders.api.ts

import api from "@/lib/axios";

export type OrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";
export type PaymentMethod = "cash" | "card" | "online";

export interface OrderItem {
  itemName: string;
  name: string;
  qty: number;
  price: number;
  totalAmount: number;
}

export interface Order {
  _id: string;
  id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  note?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  userId: string;
  note?: string;
  phone?: string;
  address?: string;
  paymentMethod: PaymentMethod;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    limit: number;
  };
}

export interface GetOrdersParams {
  userId?: string;
  status?: OrderStatus | OrderStatus[];
  page?: number;
  limit?: number;
  sort?: string;
}

/* ================= CREATE ORDER ================= */
export const createOrder = async (data: CreateOrderPayload) => {
  const res = await api.post("/orders", data);
  return res.data.order;
};

/* ================= GET ORDERS ================= */
export const getOrders = async (params?: GetOrdersParams) => {
  const queryParams = new URLSearchParams();
  
  if (params?.userId) queryParams.append("userId", params.userId);
  if (params?.status) {
    const statuses = Array.isArray(params.status) ? params.status.join(",") : params.status;
    queryParams.append("status", statuses);
  }
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  
  const url = `/orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await api.get<OrdersResponse>(url);
  return res.data;
};

/* ================= GET ORDER BY ID ================= */
export const getOrderById = async (id: string) => {
  const res = await api.get<{ order: Order }>(`/orders/${id}`);
  return res.data.order;
};

/* ================= UPDATE ORDER ================= */
export const updateOrder = async (id: string, data: UpdateOrderPayload) => {
  const res = await api.put<{ order: Order }>(`/orders/${id}`, data);
  return res.data.order;
};

/* ================= DELETE ORDER ================= */
export const deleteOrder = async (id: string) => {
  const res = await api.delete(`/orders/${id}`);
  return res.data;
};

/* ================= GET USER DETAILS ================= */
export const getUserDetails = async (userId: string) => {
  const res = await api.get(`/users/${userId}`);
  return res.data;
};