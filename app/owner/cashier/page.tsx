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

export default function ActiveOrdersPage() {
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
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleAddOrder = () => {
    console.log("Add Order clicked");
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        status: ["pending", "preparing", "served"],
        page: currentPage,
        limit: rowsPerPage,
      });

      const mappedOrders = response.orders.map((order) => ({
        ...order,
        id: order._id,
      }));

      setOrders(mappedOrders);
      setTotalCount(response.pagination.totalOrders);

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

  // Handle real-time updates with Pusher
  useEffect(() => {
    fetchOrders();

    const pusher = getPusherClient();

    // Subscribe to admin orders channel
    const channel = pusher.subscribe('admin-orders');

    // Handle new order
    const handleNewOrder = (newOrder: Order) => {
      // Check if order status matches our active statuses
      const activeStatuses = ['pending', 'preparing', 'served'];
      if (activeStatuses.includes(newOrder.status)) {
        fetchOrders(); // Refresh the list
        toast.success(`New order #${newOrder.orderId} received!`);
      } else {
        // Still refresh to update counts if needed
        fetchOrders();
      }
    };

    // Handle order update
    const handleOrderUpdate = (updatedOrder: Order) => {
      fetchOrders(); // Refresh the list
      toast.info(`Order #${updatedOrder.orderId} has been updated`);
    };

    // Handle order deletion
    const handleOrderDelete = (deletedOrder: Order) => {
      fetchOrders(); // Refresh the list
      toast.info(`Order #${deletedOrder.orderId} has been deleted`);
    };

    // Handle status update
    const handleStatusUpdate = (updatedOrder: Order) => {
      fetchOrders(); // Refresh the list
      toast.info(`Order #${updatedOrder.orderId} status changed to ${updatedOrder.status}`);
    };

    // Handle user deletion specifically
    const handleUserDelete = (data: { _id: string; userId: string }) => {
      // Refresh the orders list to remove orders from deleted user
      fetchOrders();
      toast.info(`User ${data.userId} has been deleted. Their pending orders have been removed.`);
    };

    // Bind all events
    channel.bind('new-order', handleNewOrder);
    channel.bind('order-updated', handleOrderUpdate);
    channel.bind('order-deleted', handleOrderDelete);
    channel.bind('order-status-updated', handleStatusUpdate);
    channel.bind('user-deleted', handleUserDelete);

    // Cleanup
    return () => {
      channel.unbind('new-order', handleNewOrder);
      channel.unbind('order-updated', handleOrderUpdate);
      channel.unbind('order-deleted', handleOrderDelete);
      channel.unbind('order-status-updated', handleStatusUpdate);
      channel.unbind('user-deleted', handleUserDelete);
      pusher.unsubscribe('admin-orders');
    };
  }, [fetchOrders]);

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
          return (
            <Badge variant="outline" className={`capitalize ${colors[order.status]}`}>
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
          return (
            <Badge variant="outline" className={`capitalize ${colors[order.paymentStatus]}`}>
              {order.paymentStatus}
            </Badge>
          );
        },
      },
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
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setSelectedOrder(order);
                setIsEditOpen(true);
              }}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={() => {
                setSelectedOrder(order);
                setIsDeleteOpen(true);
              }}>
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
    createdAt: true,
    action: true,
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
      fetchOrders();
      setIsEditOpen(false);
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder?._id) {
      toast.error("Order ID is missing");
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
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DataTable
        data={orders}
        columns={columns}
        initialColumnVisibility={initialColumnVisibility}
        searchPlaceholder="Search by Order ID..."
        searchKey="orderId"
        onAddClick={handleAddOrder}
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