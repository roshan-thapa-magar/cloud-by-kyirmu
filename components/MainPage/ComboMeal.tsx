"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import ComboItem from "../ComboItem";
import { getItems } from "@/services/items.api";
import { ComboSkeleton } from "@/components/skeleton/ComboSkeleton1";
import { getPusherClient } from '@/lib/pusher-client';
import { toast } from "sonner";
import { Loader } from "lucide-react";

export default function ComboMeal() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchComboItems = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await getItems({ 
        itemType: "combo", 
        sort: "top_selling",
        limit: 5,  // Fetch only 5 items for the homepage
        page: 1
      });
      setItems(data.items);
    } catch (error) {
      console.error("Failed to fetch combo items", error);
      if (isRefresh) {
        toast.error("Failed to refresh combo items");
      }
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Debounced refresh function
  const refreshItems = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      fetchComboItems(true);
    }, 300);
  }, [fetchComboItems]);

  useEffect(() => {
    fetchComboItems();
  }, [fetchComboItems]);

  // Pusher events for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('items');

    // Handle item creation
    const handleItemCreated = (newItem: any) => {
      // Only refresh if the new item is a combo
      if (newItem.itemType === "combo") {
        refreshItems();
        toast.success(`New combo "${newItem.itemName}" available!`);
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

  // Don't show anything if no items and not loading
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <div>
      {(loading || items.length > 0) && (
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold">Combo Meals</span>
            {isRefreshing && (
              <Loader className="animate-spin h-4 w-4 text-primary" />
            )}
          </div>
          <Link
            href="/allCombos"
            className="font-extrabold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
          >
            See all
          </Link>
        </div>
      )}

      <div className="flex overflow-x-auto hide-scrollbar space-x-2 md:space-x-4 py-2">
        {loading ? (
          <ComboSkeleton count={5} />
        ) : (
          items.map((item) => (
            <ComboItem
              key={item._id}
              item={{ ...item }}
              className="truncate-text w-[80%] sm:w-1/2 md:w-1/3 lg:w-[23%]"
            />
          ))
        )}
      </div>
    </div>
  );
}