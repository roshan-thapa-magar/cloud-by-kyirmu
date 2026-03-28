"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/delete-dialog";
import DataTable, { ColumnDefinition } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher-client";
import {
  fetchOrdersApi,
  cancelOrderApi,
  OrderItem,
} from "@/services/order.api";

export default function OrderHistoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?._id;

  // ---------------- State ----------------
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // ---------------- Fetch Orders ----------------
  const fetchOrders = useCallback(async (page = 1, limit = 10) => {
    if (!userId) return;

    try {
      const data = await fetchOrdersApi({ userId, page, limit });
      setOrders(data.orders);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalOrders(data.totalOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    }
  }, [userId]);

  // ---------------- Initial Fetch ----------------
  useEffect(() => {
    fetchOrders(currentPage, rowsPerPage);
  }, [userId, currentPage, rowsPerPage, fetchOrders]);

  // ---------------- Pusher Real-time Updates ----------------
  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    // Subscribe to user-specific orders channel
    const userChannel = pusher.subscribe(`user-${userId}-orders`);

    // Handle new order creation
    const handleOrderCreated = (newOrder: OrderItem) => {
      toast.info(`New order #${newOrder.orderId} created!`);
      // Refresh orders to show the new order
      fetchOrders(currentPage, rowsPerPage);
    };

    // Handle order update (status, payment, etc.)
    const handleOrderUpdated = (updatedOrder: OrderItem) => {
      // Update local state immediately for better UX
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === updatedOrder._id 
            ? { ...updatedOrder }
            : order
        )
      );
      
      // Show notification for status changes
      if (updatedOrder.status === 'cancelled') {
        toast.warning(`Order #${updatedOrder.orderId} has been cancelled`);
      } else if (updatedOrder.status === 'completed') {
        toast.success(`Order #${updatedOrder.orderId} has been completed!`);
      } else if (updatedOrder.status === 'preparing') {
        toast.info(`Order #${updatedOrder.orderId} is being prepared`);
      } else if (updatedOrder.status === 'served') {
        toast.success(`Order #${updatedOrder.orderId} has been served!`);
      }
      
      // Also refresh from server to ensure consistency
      fetchOrders(currentPage, rowsPerPage);
    };

    // Handle order deletion
    const handleOrderDeleted = (deletedOrder: OrderItem) => {
      setOrders(prevOrders => 
        prevOrders.filter(order => order._id !== deletedOrder._id)
      );
      setTotalOrders(prev => prev - 1);
      toast.info(`Order #${deletedOrder.orderId} has been removed`);
      
      // If current page becomes empty and not first page, go to previous page
      if (orders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchOrders(currentPage, rowsPerPage);
      }
    };

    // Handle status update specifically
    const handleStatusUpdate = (updatedOrder: OrderItem) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === updatedOrder._id 
            ? { ...updatedOrder }
            : order
        )
      );
      
      // Show notification
      const statusMessages: Record<string, string> = {
        pending: "Order is pending confirmation",
        preparing: "Order is being prepared",
        served: "Order has been served",
        completed: "Order completed! Thank you for ordering!",
        cancelled: "Order has been cancelled"
      };
      
      if (statusMessages[updatedOrder.status]) {
        toast.info(statusMessages[updatedOrder.status]);
      }
    };

    // Bind all events
    userChannel.bind('order-created', handleOrderCreated);
    userChannel.bind('order-updated', handleOrderUpdated);
    userChannel.bind('order-deleted', handleOrderDeleted);
    userChannel.bind('order-status-updated', handleStatusUpdate);

    // Cleanup on unmount
    return () => {
      userChannel.unbind('order-created', handleOrderCreated);
      userChannel.unbind('order-updated', handleOrderUpdated);
      userChannel.unbind('order-deleted', handleOrderDeleted);
      userChannel.unbind('order-status-updated', handleStatusUpdate);
      pusher.unsubscribe(`user-${userId}-orders`);
    };
  }, [userId, currentPage, rowsPerPage, fetchOrders, orders.length]);

  // ---------------- Columns ----------------
  const columns: ColumnDefinition<OrderItem>[] = [
    {
      id: "orderId",
      name: "Order ID",
      align: "right",
      render: (item) => <span>{item.orderId}</span>,
    },
    {
      id: "totalAmount",
      name: "Total (Rs.)",
      align: "right",
      render: (item) => <span>Rs. {item.totalAmount.toFixed(2)}</span>,
    },
    {
      id: "status",
      name: "Status",
      render: (item) => {
        const colors = {
          pending: "bg-yellow-100 text-yellow-800",
          preparing: "bg-blue-100 text-blue-800",
          served: "bg-purple-100 text-purple-800",
          completed: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        const color = colors[item.status as keyof typeof colors] || "bg-gray-100 text-gray-800";
        return (
          <Badge className={`capitalize ${color}`} variant="outline">
            {item.status}
          </Badge>
        );
      },
    },
    {
      id: "paymentStatus",
      name: "Payment Status",
      render: (item) => (
        <Badge
          variant="outline"
          className={`capitalize ${
            item.paymentStatus === "paid"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {item.paymentStatus}
        </Badge>
      ),
    },
    {
      id: "paymentMethod",
      name: "Payment Method",
      render: (item) => <span className="capitalize">{item.paymentMethod || "—"}</span>,
    },
    { id: "phone", name: "Phone", render: (item) => item.phone || "—" },
    {
      id: "address",
      name: "Address",
      render: (item) => (
        <div className="max-w-[150px] truncate" title={item.address}>
          {item.address || "—"}
        </div>
      ),
    },
    {
      id: "createdAt",
      name: "Created At",
      render: (item) => moment(item.createdAt).format("MMM DD, YYYY HH:mm"),
    },
    {
      id: "actions",
      name: "Actions",
      align: "center",
      render: (item) =>
        item.status === "pending" ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrderId(item._id);
              setDeleteDialogOpen(true);
            }}
          >
            Cancel
          </Button>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  const initialColumnVisibility = {
    orderId: true,
    totalAmount: true,
    status: true,
    paymentStatus: true,
    paymentMethod: true,
    phone: true,
    address: false,
    createdAt: false,
    actions: true,
  };

  // ---------------- Cancel Order ----------------
  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    setDeletingId(selectedOrderId);

    const success = await cancelOrderApi(selectedOrderId);
    if (!success) {
      toast.error("Failed to cancel order");
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setSelectedOrderId(null);
      return;
    }

    toast.success("Order cancelled successfully!");
    await fetchOrders(currentPage, rowsPerPage);
    setDeletingId(null);
    setDeleteDialogOpen(false);
    setSelectedOrderId(null);
  };

  // ---------------- New Order Redirect ----------------
  const handleNewOrder = () => router.push("/filter");

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-6">Order History</h1>

      <DataTable
        data={orders}
        columns={columns}
        initialColumnVisibility={initialColumnVisibility}
        searchPlaceholder="Search by orderId..."
        addLabel="New Order"
        onAddClick={handleNewOrder}
        searchKey="orderId"
        pagination={{
          currentPage,
          rowsPerPage,
          totalCount: totalOrders,
          onPageChange: (page) => setCurrentPage(page),
          onRowsPerPageChange: (limit) => setRowsPerPage(limit),
        }}
      />

      <DeleteDialog
        isOpen={deleteDialogOpen}
        isLoading={deletingId !== null}
        title="Cancel Order?"
        description="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel"
        loadingText="Cancelling..."
        cancelText="No, Keep"
        onConfirm={handleCancelOrder}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}