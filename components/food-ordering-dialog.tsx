"use client";

import { useState, useEffect, ReactNode, useMemo, memo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { Textarea } from "./ui/textarea";
import { useBag } from "@/context/BagContext";
import { useSession } from "next-auth/react"
import { useAuthModal } from "@/context/auth-modal-context"

interface ToppingItem {
  title: string;
  price: number;
  _id?: string;
}

interface Topping {
  toppingTitle: string;
  selectionType: "single" | "multiple";
  required?: boolean;
  items?: ToppingItem[];
}

interface Item {
  _id: string;
  itemName: string;
  image: string;
  price: string | number;
  description: string;
  toppings?: Topping[];
}

interface FoodOrderingDialogProps {
  item: Item;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Memoized NoteInput component to prevent re-renders
const NoteInput = memo(({ note, setNote }: { note: string; setNote: (value: string) => void }) => {
  return (
    <div className="mt-4">
      <label className="block text-sm font-semibold mb-1">Add Note (optional)</label>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add extra instructions..."
        className="w-full border rounded-md p-2 resize-none"
      />
    </div>
  );
});

NoteInput.displayName = "NoteInput";

// Memoized SpicyLevel component
const SpicyLevel = memo(({
  title,
  items,
  value,
  onChange
}: {
  title: string;
  items: ToppingItem[];
  value: number;
  onChange: (index: number) => void;
}) => {
  const currentItem = items[value]?.title || "None";
  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-semibold mt-4">{title}</h2>
      <div className="text-center text-2xl font-bold text-purple-600 cursor-pointer">{currentItem}</div>
      <div className="relative pt-6">
        <Slider
          value={[value]}
          onValueChange={(val) => onChange(val[0])}
          min={0}
          max={Math.max(0, items.length - 1)}
          step={1}
          className="[&>span:first-child]:bg-red-500 [&_[role=slider]]:bg-red-600 [&_[role=slider]]:border-red-600 cursor-pointer"
        />
      </div>
    </div>
  );
});

SpicyLevel.displayName = "SpicyLevel";

export function FoodOrderingDialog({ item, children, open, onOpenChange }: FoodOrderingDialogProps) {
  const { user } = useUser();
  const { addToBag } = useBag();
  const { data: session, status } = useSession()
  const { openModal } = useAuthModal()

  const [internalOpen, setInternalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [multipleToppings, setMultipleToppings] = useState<Record<string, Set<string>>>({});
  const [singleToppings, setSingleToppings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [openNote, setOpenNote] = useState(false);

  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  // Handle opening with auth check
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && status !== "authenticated") {
      openModal();
      return;
    }
    if (session?.user?.role !== "user") {
      openModal();
      return;
    }
    setIsOpen(newOpen);
  };

  // Handle trigger click
  const handleTriggerClick = (e: React.MouseEvent) => {
    if (status !== "authenticated") {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    }
    if (session?.user?.role !== "user") {
      e.preventDefault();
      e.stopPropagation();
      openModal();
      return;
    }
  };

  // Initialize single toppings
  useEffect(() => {
    const initialSingle: Record<string, number> = {};
    item.toppings?.forEach((t) => {
      if (t.selectionType === "single") initialSingle[t.toppingTitle] = 0;
    });
    setSingleToppings(initialSingle);
  }, [item.toppings]);

  // Checkbox handler for multiple toppings
  const handleCheckboxChange = (group: string, title: string, checked: boolean) => {
    setMultipleToppings((prev) => {
      const groupSet = new Set(prev[group] || []);
      if (checked) groupSet.add(title);
      else groupSet.delete(title);
      return { ...prev, [group]: groupSet };
    });
  };

  // Slider handler for single toppings
  const handleSliderChange = (group: string, index: number) => {
    setSingleToppings((prev) => ({ ...prev, [group]: index }));
  };

  // Reset form
  const resetForm = () => {
    setQuantity(1);
    setNote("");
    setMultipleToppings({});
    const initialSingle: Record<string, number> = {};
    item.toppings?.forEach((t) => {
      if (t.selectionType === "single") initialSingle[t.toppingTitle] = 0;
    });
    setSingleToppings(initialSingle);
    setOpenNote(false);
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in");
      return;
    }

    setLoading(true);

    const toppingsPayload =
      item.toppings?.map((topping) => {
        if (topping.selectionType === "multiple") {
          const selectedItems = Array.from(multipleToppings[topping.toppingTitle] || []).map((title) => {
            const itemObj = topping.items?.find((i) => i.title === title);
            return { title: itemObj?.title || title, price: itemObj?.price || 0 };
          });

          // Only return if there are selected items OR if the topping group is required
          if (selectedItems.length > 0 || topping.required) {
            return {
              toppingTitle: topping.toppingTitle,
              selectionType: "multiple",
              items: selectedItems
            };
          }
          return null; // Skip this topping group if no items selected and not required
        } else {
          const index = singleToppings[topping.toppingTitle] || 0;
          const selectedItem = topping.items?.[index];

          // For single selection, check if an item is actually selected (index > 0) OR if required
          if (index > 0 || topping.required) {
            return {
              toppingTitle: topping.toppingTitle,
              selectionType: "single",
              selectedItem: selectedItem?.title || "",
              items: topping.items,
            };
          }
          return null; // Skip if no item selected and not required
        }
      }).filter(Boolean) || []; // Remove all null entries

    const payload = {
      userId: user._id,
      itemId: item._id,
      itemName: item.itemName,
      price: item.price,
      qty: quantity,
      image: item.image,
      note,
      toppings: toppingsPayload,
      createdAt: new Date().toISOString(),
    };

    const success = await addToBag(payload);
    if (success) {
      setIsOpen(false);
      resetForm();
    }
    setLoading(false);
  };

  // Media query hook
  const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
      const media = window.matchMedia(query);
      setMatches(media.matches);
      const listener = () => setMatches(media.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }, [query]);
    return matches;
  };

  const isMobile = useMediaQuery("(max-width: 600px)");

  // Memoized Content component to prevent unnecessary re-renders
  const Content = useMemo(() => {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 md:p-0 space-y-2 md:mb-4 hide-scrollbar overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="relative w-full h-[30vh] rounded-lg overflow-hidden">
            <Image
              src={item.image}
              alt={item.itemName}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover cursor-grab active:cursor-grabbing"
              priority
            />
          </div>
          <p className="font-medium">{item.description}</p>
          <div className="flex justify-between items-center">
            <p className="text-xl font-extrabold">Rs. {item.price}</p>
            <span
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setOpenNote((prev) => !prev)}
            >
              <Plus className="w-5 h-5" />
            </span>
          </div>

          {/* Use memoized NoteInput component */}
          {openNote && <NoteInput note={note} setNote={setNote} />}

          <div className="space-y-4">
            {item.toppings?.map((topping) =>
              topping.selectionType === "multiple" ? (
                <div key={topping.toppingTitle} className="space-y-4">
                  <h1 className="text-lg font-extrabold">{topping.toppingTitle}</h1>
                  <FieldGroup className="space-y-4 !gap-0">
                    {topping.items?.map((toppingItem, index) => {
                      const checkboxId = `${topping.toppingTitle}-${index}`;
                      const checked = multipleToppings[topping.toppingTitle]?.has(toppingItem.title) || false;
                      return (
                        <Field key={checkboxId} orientation="horizontal" className="flex justify-between items-center">
                          {/* Left side - Checkbox and label */}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="cursor-pointer"
                              id={checkboxId}
                              checked={checked}
                              onCheckedChange={(val) =>
                                handleCheckboxChange(topping.toppingTitle, toppingItem.title, val as boolean)
                              }
                            />
                            <FieldLabel className="cursor-pointer" htmlFor={checkboxId}>
                              {toppingItem.title}
                            </FieldLabel>
                          </div>

                          {/* Right side - Price */}
                          <FieldLabel className="flex justify-end items-center cursor-pointer" htmlFor={checkboxId}>
                            Rs. {toppingItem.price}
                          </FieldLabel>
                        </Field>
                      );
                    })}
                  </FieldGroup>
                </div>
              ) : (
                <SpicyLevel
                  key={topping.toppingTitle}
                  title={topping.toppingTitle}
                  items={topping.items || []}
                  value={singleToppings[topping.toppingTitle] || 0}
                  onChange={(index) => handleSliderChange(topping.toppingTitle, index)}
                />
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-between space-x-4 p-4 md:p-0 md:pt-4 border-t bg-background sticky bottom-0 z-50">
          <div className="flex items-center space-x-4 rounded-full">
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/80 hover:bg-primary/90 text-primary-foreground"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-semibold min-w-[24px] text-center text-foreground">{quantity}</span>
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/80 hover:bg-primary/90 text-primary-foreground"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
            className="flex-1 py-2 flex items-center justify-center gap-2"
            onClick={handleAddToCart}
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin w-5 h-5" />}
            {loading ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </div>
    );
  }, [
    item,
    quantity,
    multipleToppings,
    singleToppings,
    openNote,
    note,
    loading,
    handleCheckboxChange,
    handleSliderChange,
    handleAddToCart
  ]);

  // Mobile Drawer vs Desktop Dialog
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild onClick={handleTriggerClick}>
          {children}
        </DrawerTrigger>
        <DrawerContent
          className="h-auto z-[1100]"
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus
        >
          <DrawerHeader>
            <div className="flex justify-between items-center">
              <DrawerTitle>{item.itemName}</DrawerTitle>
              <DrawerClose asChild>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto">
            {Content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={handleTriggerClick}>
        {children}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent auto-focus
      >
        <DialogHeader>
          <DialogTitle>{item.itemName}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          {Content}
        </div>
      </DialogContent>
    </Dialog>
  );
}