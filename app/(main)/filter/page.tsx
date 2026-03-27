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
      
      if (isInitial) {
        setItems(data.items)
      } else {
        setItems(prev => [...prev, ...data.items])
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
      // Only refresh if on first page and filters match
      if (page === 1) {
        // Check if the new item matches current filters
        let shouldRefresh = true;
        
        // Check price filter
        if (minPrice !== "" && newItem.price < minPrice) shouldRefresh = false;
        if (maxPrice !== "" && newItem.price > maxPrice) shouldRefresh = false;
        
        // Check category filter
        if (selectedCid.length > 0) {
          // You might need to check if item's category matches selected categories
          // This depends on your data structure
          shouldRefresh = false; // Implement your category matching logic
        }
        
        if (shouldRefresh) {
          setPage(1);
          setItems([]);
          setHasMore(true);
          fetchComboItems(1, true);
          toast.success(`New item added: ${newItem.itemName}`);
        } else {
          // Item doesn't match current filters, just update total count
          setTotalItems(prev => prev + 1);
        }
      } else {
        // Mark that we need to refresh when user goes back to first page
        needRefreshRef.current = true;
        setTotalItems(prev => prev + 1);
      }
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
      setItems(prev => prev.filter(item => item._id !== _id));
      setTotalItems(prev => prev - 1);
      
      // If current page becomes empty and not first page, go to previous page
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else if (page === 1 && items.length === 1) {
        fetchComboItems(1, true);
      }
      
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
  }, [page, minPrice, maxPrice, selectedCid, fetchComboItems, items.length]);

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