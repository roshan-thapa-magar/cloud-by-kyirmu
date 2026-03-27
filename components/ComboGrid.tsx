"use client";

import ComboItem from "@/components/ComboItem";
import SortDropdown from "@/components/SortDropdown";
import FilterSidebar from "./FilterSidebar";
import { SlidersHorizontal, Loader } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ComboSkeleton } from "@/components/skeleton/ComboSkeleton";

interface ComboGridProps {
  items: any[];
  sort: string;
  setSort: (value: string) => void;
  minPrice?: number | "";
  maxPrice?: number | "";
  setMinPrice?: (val: number | "") => void;
  setMaxPrice?: (val: number | "") => void;
  setSelectedCid?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCid?: string[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  totalItems?: number;
  setPage?: React.Dispatch<React.SetStateAction<number>>;
}

export default function ComboGrid({
  items,
  sort,
  setSort,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  selectedCid,
  setSelectedCid,
  loading = false,
  loadingMore = false,
  hasMore = true,
  totalItems = 0,
  setPage,
}: ComboGridProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore || !setPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
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
  }, [loading, loadingMore, hasMore, setPage, items]);

  return (
    <main className="w-full overflow-y-auto hide-scrollbar space-y-2">
      {/* Sort & Mobile Filter */}
      <div className="flex justify-between items-center">
        {/* Desktop Label */}
        <span className="hidden md:flex font-medium">Sort By</span>

        {/* Sort Dropdown */}
        <SortDropdown sort={sort} setSort={setSort} />

        {/* Mobile Filter Button */}
        <span
          className="md:hidden cursor-pointer"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal />
        </span>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid custom-grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <ComboSkeleton count={8} />
        </div>
      ) : items?.length > 0 ? (
        <>
          <div className="grid custom-grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {items.map((item, index) => (
              <div
                key={item._id}
                ref={index === items.length - 1 ? lastItemRef : null}
              >
                <ComboItem key={item._id} item={item} className="w-full" />
              </div>
            ))}
          </div>
          
          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-8">
              <Loader className="animate-spin h-6 w-6 text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading more items...
              </span>
            </div>
          )}
          
          {/* End of items message */}
          {!hasMore && items.length > 0 && items.length === totalItems && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              You've reached the end! No more items to load.
            </div>
          )}
        </>
      ) : (
        <div className="col-span-full text-center py-10 text-gray-500">
          No items found
        </div>
      )}

      {/* Mobile Filter Drawer */}
      <div className="md:hidden">
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
      </div>
    </main>
  );
}