"use client"
import ComboItem from '@/components/ComboItem';
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Loader } from 'lucide-react';
import { getItems } from "@/services/items.api";
import SortDropdown from "@/components/SortDropdown";
import { ComboSkeleton } from '@/components/skeleton/ComboSkeleton';
import { getPusherClient } from '@/lib/pusher-client';
import { toast } from "sonner";

export default function Page() {
  const [sort, setSort] = useState<string>("default");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchComboItems = async (pageNum: number, isInitial: boolean = false, isRefresh: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoadingMore(true);
      }

      const data = await getItems({
        itemType: "combo",
        sort: sort,
        page: pageNum,
        limit: 8, // Fetch 8 items per page
      });

      if (isInitial || isRefresh) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }

      // Update pagination info
      const total = data.pagination?.total || 0;
      const currentPage = data.pagination?.page || pageNum;
      const totalPages = data.pagination?.totalPages || 0;

      setTotalItems(total);
      setHasMore(currentPage < totalPages);

    } catch (error) {
      console.error("Failed to fetch combo items", error);
      if (!isInitial && !isRefresh) {
        toast.error("Failed to load more items");
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      } else if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Initial fetch when sort changes
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    fetchComboItems(1, true);
  }, [sort]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore || isRefreshing) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isRefreshing) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5, rootMargin: "100px" }
    );

    if (lastItemRef.current) {
      observer.observe(lastItemRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, items, isRefreshing]);

  // Fetch next page when page changes
  useEffect(() => {
    if (page > 1) {
      fetchComboItems(page, false);
    }
  }, [page]);

  // Debounced refresh function
  const refreshItems = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      setPage(1);
      setItems([]);
      setHasMore(true);
      fetchComboItems(1, true, true);
    }, 300);
  }, [sort]);

  // Pusher events for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('items');

    // Handle item creation
    const handleItemCreated = (newItem: any) => {
      // Only refresh if the new item is a combo
      if (newItem.itemType === "combo") {
        refreshItems();
        toast.success(`New combo "${newItem.itemName}" added!`);
      }
    };

    // Handle item image update
    const handleItemImageUpdated = (updatedItem: any) => {
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
    };

    // Handle item deletion
    const handleItemDeleted = (data: { _id: string }) => {
      // Check if the deleted item is a combo and exists in current items
      const deletedItem = items.find(item => item._id === data._id);
      if (deletedItem && deletedItem.itemType === "combo") {
        refreshItems();
        toast.info(`Combo item removed`);
      } else if (deletedItem) {
        // Just remove from current list if not a combo
        setItems(prev => prev.filter(item => item._id !== data._id));
      }
    };

    // Handle item update
    const handleItemUpdated = (updatedItem: any) => {
      // Check if the updated item is a combo
      if (updatedItem.itemType === "combo") {
        // Update in place if it exists
        setItems(prev => {
          const exists = prev.some(item => item._id === updatedItem._id);
          if (exists) {
            return prev.map(item =>
              item._id === updatedItem._id ? updatedItem : item
            );
          } else {
            // Item was changed from non-combo to combo, refresh
            refreshItems();
            return prev;
          }
        });
        toast.info(`Combo "${updatedItem.itemName}" updated`);
      } else {
        // If item type changed from combo to something else, remove from list
        setItems(prev => prev.filter(item => item._id !== updatedItem._id));
      }
    };

    // Handle bulk items update
    const handleItemsBulkUpdate = () => {
      refreshItems();
    };

    // Bind all Pusher events
    channel.bind('item-created', handleItemCreated);
    channel.bind('item-image-updated', handleItemImageUpdated);
    channel.bind('item-deleted', handleItemDeleted);
    channel.bind('item-updated', handleItemUpdated);
    channel.bind('items-bulk-update', handleItemsBulkUpdate);

    // Cleanup
    return () => {
      channel.unbind('item-created', handleItemCreated);
      channel.unbind('item-image-updated', handleItemImageUpdated);
      channel.unbind('item-deleted', handleItemDeleted);
      channel.unbind('item-updated', handleItemUpdated);
      channel.unbind('items-bulk-update', handleItemsBulkUpdate);
      pusher.unsubscribe('items');

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [items, refreshItems]);

  return (
    <div>
      <div className='flex justify-between items-center pb-4'>
        <span className="text-xl font-extrabold">Combo Meals</span>
        <SortDropdown sort={sort} setSort={setSort} />
      </div>

      {loading ? (
        <div className="grid custom-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ComboSkeleton count={8} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center w-full h-40 text-muted-foreground text-lg">
          No combo items found
        </div>
      ) : (
        <>
          {/* Refresh indicator */}
          {isRefreshing && (
            <div className="flex justify-center items-center py-4 mb-4 bg-muted/50 rounded-lg">
              <Loader className="animate-spin h-5 w-5 text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Updating items...</span>
            </div>
          )}

          <div className="grid custom-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
              <div
                key={item._id}
                ref={index === items.length - 1 ? lastItemRef : null}
              >
                <ComboItem key={item._id} item={{ ...item }} className="w-full" />
              </div>
            ))}
          </div>

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-8">
              <Loader className="animate-spin h-6 w-6 text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading more items...</span>
            </div>
          )}

          {/* End of items message */}
          {!hasMore && items.length > 0 && items.length === totalItems && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              You've reached the end! No more combo items to load.
            </div>
          )}
        </>
      )}
    </div>
  );
}