"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { X } from "lucide-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { getCategories } from "@/services/category.api";
import CategorySkeleton from "@/components/skeleton/CategorySkeleton";
import { getPusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";

interface FilterSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  minPrice?: number | "";
  maxPrice?: number | "";
  setMinPrice?: (val: number | "") => void;
  setMaxPrice?: (val: number | "") => void;
  setSelectedCid?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCid?: string[];
}

interface Category {
  _id: string;
  categoryName: string;
  image?: string;
}

/* ---------------- CATEGORY LIST ---------------- */

function CategoryList({
  prefix,
  setSelectedCid,
  selectedCid,
}: {
  prefix: string;
  setSelectedCid?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCid?: string[];
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategory = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
    
    const pusher = getPusherClient();
    const channel = pusher.subscribe('categories');

    // Handle new category created
    const handleCategoryCreated = (newCategory: Category) => {
      console.log('New category created:', newCategory);
      setCategories(prev => {
        // Check if category already exists to avoid duplicates
        if (prev.some(c => c._id === newCategory._id)) return prev;
        return [...prev, newCategory];
      });
      toast.success(`New category "${newCategory.categoryName}" added`);
    };

    // Handle category updated
    const handleCategoryUpdated = (updatedCategory: Category) => {
      console.log('Category updated:', updatedCategory);
      setCategories(prev =>
        prev.map(c => (c._id === updatedCategory._id ? updatedCategory : c))
      );
      toast.info(`Category "${updatedCategory.categoryName}" updated`);
    };

    // Handle category image updated
    const handleCategoryImageUpdated = (updatedCategory: Category) => {
      console.log('Category image updated:', updatedCategory);
      setCategories(prev =>
        prev.map(c => (c._id === updatedCategory._id ? updatedCategory : c))
      );
    };

    // Handle category deleted
    const handleCategoryDeleted = (data: { _id: string }) => {
      console.log('Category deleted:', data._id);
      const deletedCategory = categories.find(c => c._id === data._id);
      setCategories(prev => prev.filter(c => c._id !== data._id));
      
      // Also remove from selected categories if it was selected
      if (selectedCid?.includes(data._id)) {
        setSelectedCid?.((prev = []) => prev.filter(id => id !== data._id));
      }
      
      if (deletedCategory) {
        toast.info(`Category "${deletedCategory.categoryName}" removed`);
      }
    };

    // Bind all Pusher events
    channel.bind('category-created', handleCategoryCreated);
    channel.bind('category-updated', handleCategoryUpdated);
    channel.bind('category-image-updated', handleCategoryImageUpdated);
    channel.bind('category-deleted', handleCategoryDeleted);

    // Cleanup
    return () => {
      channel.unbind('category-created', handleCategoryCreated);
      channel.unbind('category-updated', handleCategoryUpdated);
      channel.unbind('category-image-updated', handleCategoryImageUpdated);
      channel.unbind('category-deleted', handleCategoryDeleted);
      pusher.unsubscribe('categories');
    };
  }, [selectedCid, setSelectedCid]);

  if (loading) {
    return <CategorySkeleton count={13} />;
  }

  return (
    <FieldGroup className="flex-1 overflow-y-auto space-y-3 hide-scrollbar !gap-2 !p-0">
      {categories.length === 0 ? (
        <div className="flex flex-1 items-center justify-center h-full text-center text-muted-foreground p-4">
          No categories found
        </div>
      ) : (
        categories.map((item) => {
          const checkboxId = `${prefix}-category-${item._id}`;
          return (
            <Field
              key={item._id}
              orientation="horizontal"
              className="flex items-center gap-2"
            >
              <Checkbox
                id={checkboxId}
                checked={selectedCid?.includes(item._id) || false}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true;

                  setSelectedCid?.((prev = []) => {
                    if (isChecked) return [...prev, item._id];
                    return prev.filter((id) => id !== item._id);
                  });
                }}
              />
              <FieldLabel htmlFor={checkboxId}>
                {item.categoryName}
              </FieldLabel>
            </Field>
          );
        })
      )}
    </FieldGroup>
  );
}

/* ---------------- MAIN SIDEBAR ---------------- */

export default function FilterSidebar({
  open,
  setOpen,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  setSelectedCid,
  selectedCid,
}: FilterSidebarProps) {
  const handleClear = () => {
    setSelectedCid?.([]);
    setMinPrice?.("");
    setMaxPrice?.("");
    toast.info("Filters cleared");
  };

  return (
    <>
      {/* ---------------- DESKTOP SIDEBAR ---------------- */}

      <div className="hidden lg:block w-64 h-full">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold">FILTER</span>

            <button
              className="text-sm text-muted-foreground hover:underline cursor-pointer"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>

          <CategoryList
            prefix="desktop"
            setSelectedCid={setSelectedCid}
            selectedCid={selectedCid}
          />

          {/* PRICE FILTER */}
          <div className="border-t mt-4 pt-4">
            <span className="font-medium block mb-2">Prices (Rs.)</span>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice?.(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
              />

              <span>:</span>

              <Input
                placeholder="Max"
                type="number"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice?.(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- MOBILE DRAWER ---------------- */}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="border-b">
            <div className="flex justify-between items-center">
              <DrawerTitle>FILTERS</DrawerTitle>

              <DrawerClose asChild>
                <button>
                  <X size={20} />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <CategoryList
              prefix="mobile"
              setSelectedCid={setSelectedCid}
              selectedCid={selectedCid}
            />
          </div>

          {/* PRICE FILTER */}
          <div className="border-t p-4 bg-background">
            <span className="font-medium block mb-2">Prices (Rs.)</span>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice?.(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
              />

              <span>:</span>

              <Input
                placeholder="Max"
                type="number"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice?.(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
              />
            </div>

            {/* CLEAR BUTTON */}
            <button
              onClick={handleClear}
              className="mt-4 w-full border rounded-md py-2 text-sm hover:bg-muted cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}