"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import ComboGrid from "@/components/ComboGrid";
import { getItems } from "@/services/items.api";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";

export default function FilterPage() {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [items, setItems] = useState<any[]>([])
  const [sort, setSort] = useState("default")
  const [minPrice, setMinPrice] = useState<number | "">("")
  const [maxPrice, setMaxPrice] = useState<number | "">("")
  const [selectedCid, setSelectedCid] = useState<string[]>([])

  // Pagination states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Ref to track if we need to refresh
  const needRefreshRef = useRef(false);
  // Ref to store current items for duplicate checking in Pusher events
  const itemsRef = useRef(items);

  // Update ref when items change
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /* ---------------- INITIALIZE FROM URL ---------------- */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const cid = searchParams.get("cid")
    const min = searchParams.get("min")
    const max = searchParams.get("max")

    if (cid) setSelectedCid(cid.split(","))
    if (min) setMinPrice(Number(min))
    if (max) setMaxPrice(Number(max))
  }, [])

  /* ---------------- FETCH ITEMS WITH PAGINATION ---------------- */
  const fetchComboItems = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = {
        sort,
        page: pageNum,
        limit: 8 // Fetch 8 items per page
      }

      if (minPrice !== "") params.minPrice = minPrice
      if (maxPrice !== "") params.maxPrice = maxPrice
      if (selectedCid.length > 0) params.cid = selectedCid.join(",")

      const data = await getItems(params)
      console.log(data.items)

      if (isInitial) {
        setItems(data.items)
      } else {
        setItems(prev => {
          // Create a Map to ensure uniqueness by _id
          const itemsMap = new Map();
          // Add existing items
          prev.forEach(item => itemsMap.set(item._id, item));
          // Add new items (will overwrite duplicates)
          data.items.forEach(item => itemsMap.set(item._id, item));
          return Array.from(itemsMap.values());
        });
      }

      // Update pagination info
      const total = data.pagination?.total || 0
      const currentPage = data.pagination?.page || pageNum
      const totalPages = data.pagination?.totalPages || 0

      setTotalItems(total)
      setHasMore(currentPage < totalPages)

    } catch (error) {
      console.error("Failed to fetch combo items", error)
      toast.error("Failed to load items")
    } finally {
      if (isInitial) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }, [sort, minPrice, maxPrice, selectedCid])

  /* ---------------- UPDATE URL IMMEDIATELY ---------------- */
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCid.length > 0) params.set("cid", selectedCid.join(","))
    if (minPrice !== "") params.set("min", String(minPrice))
    if (maxPrice !== "") params.set("max", String(maxPrice))

    router.push(`?${params.toString()}`, { scroll: false })
  }, [selectedCid, minPrice, maxPrice, router])

  /* ---------------- RESET PAGINATION WHEN FILTERS CHANGE ---------------- */
  useEffect(() => {
    setPage(1)
    setItems([])
    setHasMore(true)
    fetchComboItems(1, true)
  }, [sort, minPrice, maxPrice, selectedCid, fetchComboItems])

  /* ---------------- FETCH NEXT PAGE ---------------- */
  useEffect(() => {
    if (page > 1) {
      fetchComboItems(page, false)
    }
  }, [page, fetchComboItems])

  /* ---------------- PUSHER REAL-TIME EVENTS ---------------- */
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('items');

    // Handle new item creation
    const handleItemCreated = (newItem: any) => {
      // Check if item already exists in current list
      const itemExists = itemsRef.current.some(item => item._id === newItem._id);
      
      if (itemExists) {
        console.warn('Item already exists, skipping duplicate addition:', newItem._id);
        return;
      }

      setTotalItems((prev) => prev + 1);

      // check filters (important so UI stays correct)
      const matchPrice =
        (minPrice === "" || newItem.price >= minPrice) &&
        (maxPrice === "" || newItem.price <= maxPrice);

      const matchCategory =
        selectedCid.length === 0 || selectedCid.includes(newItem.cid);

      const matchesCurrentView = matchPrice && matchCategory;

      if (!matchesCurrentView) return;

      // ✅ Add item to TOP (newest first) - ensure uniqueness
      setItems((prev) => {
        // Double-check for duplicates before adding
        if (prev.some(item => item._id === newItem._id)) {
          return prev;
        }
        return [newItem, ...prev];
      });

      toast.success(`New item added: ${newItem.itemName}`);
    };
    
    // Handle item update
    const handleItemUpdated = (updatedItem: any) => {
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id
            ? { ...updatedItem }
            : item
        )
      );

      // Check if item matches current filters and refresh if needed
      let shouldRefresh = false;
      if (minPrice !== "" && updatedItem.price < minPrice) shouldRefresh = true;
      if (maxPrice !== "" && updatedItem.price > maxPrice) shouldRefresh = true;
      
      // Check if category filter is affected
      if (selectedCid.length > 0 && !selectedCid.includes(updatedItem.cid)) {
        shouldRefresh = true;
      }

      if (shouldRefresh && page === 1) {
        fetchComboItems(1, true);
      }

      toast.info(`Item updated: ${updatedItem.itemName}`);
    };

    // Handle item image update
    const handleItemImageUpdated = (updatedItem: any) => {
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id ? { ...updatedItem } : item
        )
      );
      toast.success(`Image updated for: ${updatedItem.itemName}`);
    };

    // Handle item deletion
    const handleItemDeleted = ({ _id }: { _id: string }) => {
      setItems(prev => {
        const newItems = prev.filter(item => item._id !== _id);
        
        // If current page becomes empty and not first page, go to previous page
        if (newItems.length === 0 && page > 1) {
          setPage(page - 1);
        } else if (page === 1 && prev.length === 1) {
          fetchComboItems(1, true);
        }
        
        return newItems;
      });
      setTotalItems(prev => prev - 1);

      toast.info("Item has been deleted");
    };

    // Bind all Pusher events
    channel.bind('item-created', handleItemCreated);
    channel.bind('item-updated', handleItemUpdated);
    channel.bind('item-image-updated', handleItemImageUpdated);
    channel.bind('item-deleted', handleItemDeleted);

    // Cleanup on unmount
    return () => {
      channel.unbind('item-created', handleItemCreated);
      channel.unbind('item-updated', handleItemUpdated);
      channel.unbind('item-image-updated', handleItemImageUpdated);
      channel.unbind('item-deleted', handleItemDeleted);
      pusher.unsubscribe('items');
    };
  }, [minPrice, maxPrice, selectedCid, fetchComboItems, page]);

  // Effect to refresh when coming back to first page after updates
  useEffect(() => {
    if (page === 1 && needRefreshRef.current) {
      needRefreshRef.current = false;
      fetchComboItems(1, true);
    }
  }, [page, fetchComboItems]);

  return (
    <div className="flex h-full gap-4">
      <aside className="hidden md:flex border p-4 rounded-md flex-col gap-4">
        <FilterSidebar
          open={drawerOpen}
          setOpen={setDrawerOpen}
          minPrice={minPrice}
          maxPrice={maxPrice}
          setMinPrice={setMinPrice}
          setMaxPrice={setMaxPrice}
          selectedCid={selectedCid}
          setSelectedCid={setSelectedCid}
        />
      </aside>

      <ComboGrid
        items={items}
        sort={sort}
        setSort={setSort}
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        selectedCid={selectedCid}
        setSelectedCid={setSelectedCid}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        totalItems={totalItems}
        setPage={setPage}
      />
    </div>
  )
}