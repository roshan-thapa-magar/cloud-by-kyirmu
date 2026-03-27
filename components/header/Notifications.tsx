"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCircle, Clock, XCircle, Package, Truck, CheckCheck } from "lucide-react";
import moment from "moment";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getPusherClient } from "@/lib/pusher-client";
import Link from "next/link";

interface Notification {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50" },
  processing: { icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
  preparing: { icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
  shipped: { icon: Truck, color: "text-purple-500", bg: "bg-purple-50" },
  served: { icon: Truck, color: "text-purple-500", bg: "bg-purple-50" },
  delivered: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
  completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
};

const defaultStatus = { icon: CheckCheck, color: "text-gray-500", bg: "bg-gray-50" };

const Notifications = ({ userId }: { userId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const notificationsRef = useRef<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const limit = 7;

  // ---------------- Fetch notifications ----------------
  const fetchNotifications = useCallback(
    async (pageToFetch = 1) => {
      try {
        pageToFetch === 1 ? setLoading(true) : setLoadingMore(true);

        const res = await fetch(`/api/notification/${userId}?page=${pageToFetch}&limit=${limit}`);
        const data = await res.json();
        console.log(data)

        if (res.ok) {
          const newNotifications: Notification[] = data.orders.map((o: any) => ({
            id: o._id,
            orderId: o.orderId,
            status: o.status.toLowerCase(),
            createdAt: o.createdAt,
          }));
          console.log(newNotifications)

          // Deduplicate & merge
          const merged = [...notificationsRef.current, ...newNotifications].filter(
            (v, i, a) => a.findIndex(n => n.id === v.id) === i
          );

          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setNotifications(merged);
          notificationsRef.current = merged;

          // unread count (last 24h)
          const recentCount = merged.filter(n => {
            const hoursDiff = (new Date().getTime() - new Date(n.createdAt).getTime()) / (1000 * 3600);
            return hoursDiff < 24;
          }).length;
          setUnreadCount(recentCount);

          setTotalPages(data.pagination.totalPages);
          setPage(pageToFetch);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId]
  );

  // ---------------- Handle new notifications ----------------
  const handleNewNotification = useCallback((order: any) => {
    const newNotification: Notification = {
      id: order._id,
      orderId: order.orderId,
      status: order.status.toLowerCase(),
      createdAt: order.createdAt,
    };

    const updatedNotifications = [newNotification, ...notificationsRef.current].filter(
      (v, i, a) => a.findIndex(n => n.id === v.id) === i
    );

    updatedNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setNotifications(updatedNotifications);
    notificationsRef.current = updatedNotifications;
    setUnreadCount(prev => prev + 1);

    if (Notification.permission === "granted") {
      new Notification(`Order #${order.orderId} Status Update`, {
        body: `Your order status has been updated to ${order.status}`,
        icon: "/logo.png",
      });
    }
  }, []);

  const handleOrderUpdate = useCallback((updatedOrder: any) => {
    setNotifications(prev => {
      const existingIndex = prev.findIndex(n => n.id === updatedOrder._id);
      let updated: Notification[];

      if (existingIndex !== -1) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: updatedOrder.status.toLowerCase(),
          createdAt: updatedOrder.updatedAt || updatedOrder.createdAt,
        };
      } else {
        const newNotification: Notification = {
          id: updatedOrder._id,
          orderId: updatedOrder.orderId,
          status: updatedOrder.status.toLowerCase(),
          createdAt: updatedOrder.updatedAt || updatedOrder.createdAt,
        };
        updated = [newNotification, ...prev];
        setUnreadCount(prevCount => prevCount + 1);
      }

      updated = updated.filter((v, i, a) => a.findIndex(n => n.id === v.id) === i);
      updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      notificationsRef.current = updated;
      return updated;
    });
  }, []);

  const handleOrderDelete = useCallback((deletedOrder: any) => {
    const updated = notificationsRef.current.filter(n => n.id !== deletedOrder._id);
    setNotifications(updated);
    notificationsRef.current = updated;
  }, []);

  // ---------------- Pusher ----------------
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const pusher = getPusherClient();
    const userChannel = pusher.subscribe(`user-${userId}-orders`);
    const adminChannel = pusher.subscribe("admin-orders");

    userChannel.bind("order-created", handleNewNotification);
    userChannel.bind("order-updated", handleOrderUpdate);
    userChannel.bind("order-deleted", handleOrderDelete);
    userChannel.bind("order-status-updated", handleOrderUpdate);

    adminChannel.bind("order-status-updated", handleOrderUpdate);

    if (Notification.permission === "default") Notification.requestPermission();

    return () => {
      userChannel.unbind("order-created", handleNewNotification);
      userChannel.unbind("order-updated", handleOrderUpdate);
      userChannel.unbind("order-deleted", handleOrderDelete);
      userChannel.unbind("order-status-updated", handleOrderUpdate);
      adminChannel.unbind("order-status-updated", handleOrderUpdate);

      pusher.unsubscribe(`user-${userId}-orders`);
      pusher.unsubscribe("admin-orders");
    };
  }, [userId, fetchNotifications, handleNewNotification, handleOrderUpdate, handleOrderDelete]);

  // ---------------- Infinite scroll ----------------
  const handleScroll = () => {
    if (!containerRef.current || loadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50 && page < totalPages) {
      fetchNotifications(page + 1);
    }
  };

  // ---------------- Open/Close sheet ----------------
  const handleSheetOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) setUnreadCount(0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpen}>
      <SheetTrigger asChild>
        <button className="relative cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-4 flex items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {notifications.length > 0 && (
            <span className="text-xs bg-muted px-2 py-1 rounded">{notifications.length}</span>
          )}
        </SheetHeader>

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: "500px" }}
        >
          {loading && page === 1 ? (
            <div className="h-40 flex justify-center items-center">
              <div className="animate-spin h-6 w-6 border-b-2 border-gray-900 rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400">
              <Bell className="h-10 w-10 mb-2" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n, index) => {
                const cfg = statusConfig[n.status] || defaultStatus;
                const Icon = cfg.icon;
                const date = moment(n.createdAt);

                return (
                  <Link
                    key={`${n.id}-${index}`}
                    href="/myAccount#orderHistory"
                    className="block p-4 hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${cfg.bg} border`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order Update</p>
                        <p className="text-sm text-gray-600">
                          Status: <span className={cfg.color}>{n.status}</span>
                        </p>
                        <div className="text-xs text-gray-400 mt-1">
                          {date.format("MMM D, YYYY • h:mm A")} • {date.fromNow()}
                        </div>
                        <p className="text-xs text-gray-300 font-mono mt-1">OR-ID : {n.orderId}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {loadingMore && (
                <div className="p-4 flex justify-center items-center text-gray-500">Loading more...</div>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full border rounded-lg py-2 hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Notifications;