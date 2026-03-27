"use client"
import ComboItem from '@/components/ComboItem';
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { getItems } from "@/services/items.api";
import SortDropdown from "@/components/SortDropdown";
import { ComboSkeleton } from "@/components/skeleton/ComboSkeleton";
import { getPusherClient } from '@/lib/pusher-client';
import { toast } from "sonner";
import { Loader } from 'lucide-react';

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [sort, setSort] = useState<string>("default");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchItems = async (pageNum: number, isInitial: boolean = false, isRefresh: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoadingMore(true);
      }

      const data = await getItems({
        itemType: "single",
        sort: sort,
        page: pageNum,
        limit: 8, // Fetch 8 items per page
      });
      console.log(data.items)

      if (isInitial || isRefresh) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }

      // Check if there are more items to load
      const totalPages = data.pagination?.totalPages || 0;
      const total = data.pagination?.total || 0;
      setTotalItems(total);
      setHasMore(pageNum < totalPages);

    } catch (error) {
      console.error("Failed to fetch items", error);
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

  // Initial fetch
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    fetchItems(1, true);
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
      fetchItems(page, false);
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
      fetchItems(1, true, true);
    }, 300);
  }, [sort]);

  // Pusher events for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('items');

    // Handle item creation
    const handleItemCreated = (newItem: any) => {
      console.log('New single item created:', newItem);
      // Only refresh if the new item is a single item
      if (newItem.itemType === "single") {
        refreshItems();
        toast.success(`New item "${newItem.itemName}" added!`);
      }
    };

    // Handle item image update
    const handleItemImageUpdated = (updatedItem: any) => {
      console.log('Item image updated:', updatedItem);
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
    };

    // Handle item deletion
    const handleItemDeleted = (data: { _id: string }) => {
      console.log('Item deleted:', data._id);
      // Check if the deleted item is a single and exists in current items
      const deletedItem = items.find(item => item._id === data._id);
      if (deletedItem && deletedItem.itemType === "single") {
        refreshItems();
        toast.info(`Item removed`);
      } else if (deletedItem) {
        // Just remove from current list if not a single
        setItems(prev => prev.filter(item => item._id !== data._id));
      }
    };

    // Handle item update
    const handleItemUpdated = (updatedItem: any) => {
      console.log('Item updated:', updatedItem);
      // Check if the updated item is a single item
      if (updatedItem.itemType === "single") {
        // Update in place if it exists
        setItems(prev => {
          const exists = prev.some(item => item._id === updatedItem._id);
          if (exists) {
            return prev.map(item =>
              item._id === updatedItem._id ? updatedItem : item
            );
          } else {
            // Item was changed from non-single to single, refresh
            refreshItems();
            return prev;
          }
        });
        toast.info(`Item "${updatedItem.itemName}" updated`);
      } else {
        // If item type changed from single to something else, remove from list
        setItems(prev => prev.filter(item => item._id !== updatedItem._id));
      }
    };

    // Handle bulk items update
    const handleItemsBulkUpdate = () => {
      console.log('Bulk items update');
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
        <span className="text-xl font-extrabold">Best Selling Items</span>
        <SortDropdown sort={sort} setSort={setSort} />
      </div>

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="flex justify-center items-center py-4 mb-4 bg-muted/50 rounded-lg">
          <Loader className="animate-spin h-5 w-5 text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Updating items...</span>
        </div>
      )}

      <div className="grid custom-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {loading ? (
          <ComboSkeleton count={8} />
        ) : items.length === 0 ? (
          <div className="col-span-full flex items-center justify-center w-full h-40 text-muted-foreground text-lg">
            No single items found
          </div>
        ) : (
          <>
            {items.map((item, index) => (
              <div
                key={item._id}
                ref={index === items.length - 1 ? lastItemRef : null}
              >
                <ComboItem item={{ ...item }} className="w-full" />
              </div>
            ))}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="col-span-full py-4">
                <div className="flex justify-center items-center">
                  <Loader className="animate-spin h-6 w-6 text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading more items...</span>
                </div>
                <ComboSkeleton count={4} />
              </div>
            )}

            {/* End of items message */}
            {!hasMore && items.length > 0 && items.length === totalItems && (
              <div className="col-span-full text-center py-4 text-gray-500">
                No more items to load
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}