'use client'
import React, { useEffect, useState, useCallback } from 'react'
import ComboItem from '../ComboItem';
import Link from "next/link";
import { getItems } from "@/services/items.api";
import { ComboSkeleton } from "@/components/skeleton/ComboSkeleton";
import { getPusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";

export default function PopularItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComboItems = useCallback(async () => {
    try {
      const data = await getItems({
        itemType: "single",
        sort: "popular",
      });
      setItems(data.items);
    } catch (error) {
      console.error("Failed to fetch best selling items", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchComboItems();
  }, [fetchComboItems]);

  // Pusher real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('items');

    // Handle new item creation
    const handleItemCreated = () => {
      fetchComboItems();
      toast.success("New item added!");
    };

    // Handle item image update
    const handleItemImageUpdated = (data: { _id: string; image: string; item?: any }) => {
      setItems(prev =>
        prev.map(item =>
          item._id === data._id 
            ? { ...item, image: data.image }
            : item
        )
      );
      toast.info("Item image updated");
    };

    // Handle item deletion
    const handleItemDeleted = () => {
      fetchComboItems();
      toast.info("Item has been removed");
    };

    // Handle item update
    const handleItemUpdated = () => {
      fetchComboItems();
      toast.info("Item has been updated");
    };

    // Bind events
    channel.bind('item-created', handleItemCreated);
    channel.bind('item-image-updated', handleItemImageUpdated);
    channel.bind('item-deleted', handleItemDeleted);
    channel.bind('item-updated', handleItemUpdated);

    // Cleanup
    return () => {
      channel.unbind('item-created', handleItemCreated);
      channel.unbind('item-image-updated', handleItemImageUpdated);
      channel.unbind('item-deleted', handleItemDeleted);
      channel.unbind('item-updated', handleItemUpdated);
      pusher.unsubscribe('items');
    };
  }, [fetchComboItems]);

  return (
    <div>
      <div className='flex justify-between items-center pb-4'>
        <span className="text-2xl font-extrabold">Popular Items</span>
        <Link href="/bestSellingItems" className="font-extrabold text-blue-600 cursor-pointer">
          See all
        </Link>
      </div>

      <div className="grid custom-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {loading
          ? <ComboSkeleton count={8} />
          : items.map((item) => (
            <ComboItem key={item._id} item={{ ...item }} className="w-full" />
          ))
        }
      </div>
    </div>
  )
}