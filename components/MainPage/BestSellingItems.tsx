'use client'
import React, { useEffect, useState, useCallback } from 'react'
import ComboItem from '../ComboItem';
import { getItems } from "@/services/items.api";
import { ComboSkeleton } from "@/components/skeleton/ComboSkeleton";
import { getPusherClient } from "@/lib/pusher-client";
import Link from "next/link";
import { toast } from "sonner";

interface Item {
  _id: string;
  itemName: string;
  description?: string;
  price: number;
  image?: string;
  itemType: string;
  category?: string;
  toppings?: any[];
  totalSold?: number;
}

export default function BestSellingItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const fetchComboItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getItems({
        itemType: "single",
        sort: "top_selling",
        page: 1,
        limit: 8,
      });
      
      console.log("Fetched items:", data.items?.length || 0);
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch best selling items", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComboItems();
    
    const pusher = getPusherClient();
    const channel = pusher.subscribe('items');

    // Track connection state
    if (pusher.connection) {
      pusher.connection.bind('state_change', (states: any) => {
        setIsReconnecting(states.current === 'connecting');
        if (states.current === 'connected') {
          // Refresh data when reconnected
          fetchComboItems();
          toast.success('Reconnected to real-time updates');
        } else if (states.current === 'disconnected') {
          toast.warning('Lost connection to real-time updates');
        }
      });
    }

    // Handle new item created
    const handleItemCreated = (newItem: Item) => {
      console.log('New item created:', newItem);
      // Only refresh if the item is a single item (best selling eligible)
      if (newItem.itemType === 'single') {
        fetchComboItems();
        toast.success(`New item "${newItem.itemName}" added`);
      }
    };

    // Handle item updated
    const handleItemUpdated = (updatedItem: Item) => {
      console.log('Item updated:', updatedItem);
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
    };

    // Handle item image updated
    const handleItemImageUpdated = (updatedItem: Item) => {
      console.log('Item image updated:', updatedItem);
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
    };

    // Handle item deleted
    const handleItemDeleted = (data: { _id: string }) => {
      console.log('Item deleted:', data._id);
      setItems(prev => prev.filter(item => item._id !== data._id));
      toast.info('Item removed from best selling list');
    };

    // Handle bulk item update (if needed)
    const handleItemsBulkUpdate = (updatedItems: Item[]) => {
      console.log('Bulk items update:', updatedItems);
      setItems(updatedItems.filter(item => item.itemType === 'single').slice(0, 8));
      toast.info('Items list updated');
    };

    // Bind all Pusher events
    channel.bind('item-created', handleItemCreated);
    channel.bind('item-updated', handleItemUpdated);
    channel.bind('item-image-updated', handleItemImageUpdated);
    channel.bind('item-deleted', handleItemDeleted);
    channel.bind('items-bulk-update', handleItemsBulkUpdate);

    // Cleanup
    return () => {
      channel.unbind('item-created', handleItemCreated);
      channel.unbind('item-updated', handleItemUpdated);
      channel.unbind('item-image-updated', handleItemImageUpdated);
      channel.unbind('item-deleted', handleItemDeleted);
      channel.unbind('items-bulk-update', handleItemsBulkUpdate);
      
      if (pusher.connection) {
        pusher.connection.unbind('state_change');
      }
      
      pusher.unsubscribe('items');
    };
  }, [fetchComboItems]);

  // Show reconnecting indicator if needed
  if (isReconnecting && !loading) {
    return (
      <div>
        <div className='flex justify-between items-center py-4'>
          <span className="text-2xl font-extrabold">Best Selling Items</span>
          <Link href="/bestSellingItems" className="font-extrabold text-blue-600 cursor-pointer">
            See all
          </Link>
        </div>
        <div className="grid custom-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {items.map((item) => (
            <ComboItem key={item._id} item={{ ...item }} className="w-full" />
          ))}
          <div className="col-span-full text-center py-4 text-sm text-yellow-600 animate-pulse">
            Reconnecting to real-time updates...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {(loading || items.length > 0) && (
        <div className='flex justify-between items-center py-4'>
          <span className="text-2xl font-extrabold">Best Selling Items</span>
          <Link href="/bestSellingItems" className="font-extrabold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors">
            See all
          </Link>
        </div>
      )}

      <div className="grid custom-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {loading ? (
          <ComboSkeleton count={8} />
        ) : items.length > 0 ? (
          items.map((item) => (
            <ComboItem key={item._id} item={{ ...item }} className="w-full" />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No best selling items found
          </div>
        )}
      </div>
    </div>
  );
}