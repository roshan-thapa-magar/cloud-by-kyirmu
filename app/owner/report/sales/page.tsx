"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DataTable, { type ColumnDefinition } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash, Eye } from "lucide-react";
import { DeleteDialog } from "@/components/delete-dialog";
import { EditOrderDialog } from "@/components/order/EditOrderDialog";
import { ViewItemsDialog } from "@/components/order/ViewItemsDialog";
import { UserDetailsDialog } from "@/components/order/UserDetailsDialog";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher-client";
import {
  getOrders,
  updateOrder,
  deleteOrder,
  getUserDetails,
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderItem,
} from "@/services/orders.api";

/* ================= COMPONENT ================= */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [viewItemsOpen, setViewItemsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    name: string;
    email: string;
    phone?: string;
    address?: string;
    image?: string;
  } | null>(null);

  /* ================= FETCH ORDERS WITH PAGINATION ================= */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        status: ["completed", "cancelled"],
        page: currentPage,
        limit: rowsPerPage,
      });

      // Map orders to include id field
      const mappedOrders = response.orders.map((order) => ({
        ...order,
        id: order._id,
      }));

      setOrders(mappedOrders);
      setTotalCount(response.pagination.totalOrders);
      
      // If current page becomes empty and not first page, go to previous page
      if (mappedOrders.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage]);

  /* ================= PUSHER REAL-TIME UPDATES ================= */
  useEffect(() => {
    // Initial fetch
    fetchOrders();

    // Get Pusher client and subscribe to admin channel
    const pusher = getPusherClient();
    const adminChannel = pusher.subscribe('admin-orders');

    // Handle new order
    const handleNewOrder = (newOrder: Order) => {
      // Only update if the order status is completed or cancelled
      if (newOrder.status === 'completed' || newOrder.status === 'cancelled') {
        fetchOrders();
      }
      toast.info(`New order #${newOrder.orderId} received!`);
    };

    // Handle order update
    const handleOrderUpdate = (updatedOrder: Order) => {
      // Update local state immediately for better UX
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === updatedOrder._id 
            ? { ...updatedOrder, id: updatedOrder._id }
            : order
        )
      );
      
      // Also refresh from server to ensure consistency
      fetchOrders();
      
      // Show notification for status changes
      if (updatedOrder.status === 'completed') {
        toast.success(`Order #${updatedOrder.orderId} has been completed!`);
      } else if (updatedOrder.status === 'cancelled') {
        toast.warning(`Order #${updatedOrder.orderId} has been cancelled.`);
      }
    };

    // Handle order deletion
    const handleOrderDelete = (deletedOrder: Order) => {
      setOrders(prevOrders => 
        prevOrders.filter(order => order._id !== deletedOrder._id)
      );
      setTotalCount(prev => prev - 1);
      toast.info(`Order #${deletedOrder.orderId} has been deleted.`);
    };

    // Handle order status update
    const handleStatusUpdate = (updatedOrder: Order) => {
      if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
        // If the order status changed to completed/cancelled, refresh the list
        fetchOrders();
      } else {
        // For other statuses, update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === updatedOrder._id 
              ? { ...updatedOrder, id: updatedOrder._id }
              : order
          )
        );
      }
      
      toast.info(`Order #${updatedOrder.orderId} status updated to ${updatedOrder.status}`);
    };

    // Bind all events
    adminChannel.bind('new-order', handleNewOrder);
    adminChannel.bind('order-updated', handleOrderUpdate);
    adminChannel.bind('order-deleted', handleOrderDelete);
    adminChannel.bind('order-status-updated', handleStatusUpdate);

    // Cleanup on unmount
    return () => {
      adminChannel.unbind('new-order', handleNewOrder);
      adminChannel.unbind('order-updated', handleOrderUpdate);
      adminChannel.unbind('order-deleted', handleOrderDelete);
      adminChannel.unbind('order-status-updated', handleStatusUpdate);
      pusher.unsubscribe('admin-orders');
    };
  }, [fetchOrders]);

  /* ================= USER DETAILS ================= */
  const handleUserDetailsClick = async (userId: string) => {
    setLoading(true);

    try {
      const user = await getUserDetails(userId);
      setSelectedUser(user);
      setUserDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  /* ================= COLUMNS ================= */
  const columns: ColumnDefinition<Order>[] = useMemo(
    () => [
      {
        id: "orderId",
        name: "Order ID",
        render: (order) => <span className="font-mono">{order.orderId}</span>,
      },
      {
        id: "userId",
        name: "User Details",
        render: (order) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUserDetailsClick(order.userId)}
          >
            User Details
          </Button>
        ),
      },
      {
        id: "items",
        name: "Items",
        render: (order) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedItems(order.items);
              setViewItemsOpen(true);
            }}
          >
            <Eye className="w-4 h-4 mr-1" /> View Items
          </Button>
        ),
      },
      {
        id: "totalAmount",
        name: "Total Amount",
        render: (order) => `Rs. ${order.totalAmount.toFixed(2)}`,
      },
      {
        id: "status",
        name: "Status",
        render: (order) => {
          const colors: Record<OrderStatus, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            preparing: "bg-blue-100 text-blue-800",
            served: "bg-purple-100 text-purple-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
          };
          const color = colors[order.status];
          return (
            <Badge variant="outline" className={`capitalize ${color}`}>
              {order.status}
            </Badge>
          );
        },
      },
      {
        id: "paymentStatus",
        name: "Payment Status",
        render: (order) => {
          const colors: Record<PaymentStatus, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            paid: "bg-green-100 text-green-800",
            failed: "bg-red-100 text-red-800",
          };
          const color = colors[order.paymentStatus];
          return (
            <Badge variant="outline" className={`capitalize ${color}`}>
              {order.paymentStatus}
            </Badge>
          );
        },
      },
      {
        id: "paymentMethod",
        name: "Payment Method",
        render: (order) => <span className="capitalize">{order.paymentMethod}</span>,
      },
      { id: "note", name: "Note" },
      { id: "phone", name: "Phone" },
      { id: "address", name: "Address" },
      {
        id: "createdAt",
        name: "Created At",
        render: (order) => new Date(order.createdAt).toLocaleString(),
      },
      {
        id: "action",
        name: "Action",
        align: "center",
        render: (order) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedOrder(order);
                  setIsEditOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => {
                  setSelectedOrder(order);
                  setIsDeleteOpen(true);
                }}
              >
                <Trash className="h-4 w-4 mr-1" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const initialColumnVisibility = {
    orderId: true,
    userId: true,
    items: true,
    totalAmount: true,
    status: true,
    paymentStatus: true,
    paymentMethod: false,
    note: false,
    phone: false,
    address: false,
    createdAt: true,
    action: true,
  };

  /* ================= HANDLERS ================= */
  const handleAddOrder = () => {
    console.log("Add Order clicked");
  };

  const handleSaveEdit = async (updated: {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
  }) => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const updatedOrder = await updateOrder(selectedOrder._id, updated);
      setOrders((prev) =>
        prev.map((o) => (o._id === selectedOrder._id ? { ...updatedOrder, id: updatedOrder._id } : o))
      );
      toast.success("Order updated successfully");
      fetchOrders(); // Refresh to ensure data consistency
      setIsEditOpen(false);
      setSelectedOrder(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder?._id) {
      toast.error("Order ID is missing. Cannot delete.");
      return;
    }

    setLoading(true);
    try {
      await deleteOrder(selectedOrder._id);
      setOrders((prev) => prev.filter((o) => o._id !== selectedOrder._id));
      setTotalCount((prev) => prev - 1);
      toast.success("Order deleted successfully");
      setIsDeleteOpen(false);
      setSelectedOrder(null);
      
      // Refresh to ensure data consistency
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <>
      <DataTable
        data={orders}
        columns={columns}
        initialColumnVisibility={initialColumnVisibility}
        searchPlaceholder="Search by Order ID..."
        onAddClick={handleAddOrder}
        searchKey="orderId"
        loading={loading}
        pagination={{
          currentPage,
          rowsPerPage,
          totalCount,
          onPageChange: setCurrentPage,
          onRowsPerPageChange: (newLimit) => {
            setRowsPerPage(newLimit);
            setCurrentPage(1);
          },
        }}
      />

      {selectedOrder && (
        <EditOrderDialog
          isOpen={isEditOpen}
          isLoading={loading}
          order={selectedOrder}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditOpen(false)}
        />
      )}

      <ViewItemsDialog
        isOpen={viewItemsOpen}
        items={selectedItems}
        onClose={() => setViewItemsOpen(false)}
      />

      <UserDetailsDialog
        isOpen={userDialogOpen}
        user={selectedUser}
        onClose={() => setUserDialogOpen(false)}
      />

      {selectedOrder && (
        <DeleteDialog
          isOpen={isDeleteOpen}
          isLoading={loading}
          title="Delete this order?"
          description="This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </>
  );
}