"use client";

import { ChevronDown, ChevronUp, Loader2, Minus, Plus, ShoppingBag, ShoppingCart, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import Image from "next/image";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useBag } from "@/context/BagContext";
import SpicyLevel from "../form/SpicyLevel";
import EditNoteDialog from "@/components/bag/EditNoteDialog";
import CheckoutDialog from "@/components/bag/CheckoutDialog"; // adjust path if needed

const Bag = () => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingToppingId, setDeletingToppingId] = useState<string | null>(null);
  const [updatingQtyId, setUpdatingQtyId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingNoteItem, setEditingNoteItem] = useState<any>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const {
    bagItems,
    loading,
    orderLoading,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    removeToppingItem,
    removeToppingGroup,
    updateItemNote,
    addToOrder,
    updateSelectedTopping,
  } = useBag();
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null


  const handleSaveNote = async (note: string) => {
    if (!editingNoteItem) return;

    setSavingNote(true);
    await updateItemNote(editingNoteItem._id, note);
    setSavingNote(false);
    setEditingNoteItem(null);
  };

  const toggleCustomization = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleRemoveItem = async (bagId: string) => {
    setDeletingItemId(bagId);
    await removeItem(bagId);
    setDeletingItemId(null);
  };

  const handleRemoveToppingItem = async (bagId: string, toppingItemId: string) => {
    setDeletingToppingId(toppingItemId);
    await removeToppingItem(bagId, toppingItemId);
    setDeletingToppingId(null);
  };

  const handleRemoveToppingGroup = async (bagId: string, toppingGroupId: string) => {
    setDeletingToppingId(toppingGroupId);
    await removeToppingGroup(bagId, toppingGroupId);
    setDeletingToppingId(null);
  };

  const handleUpdateQuantity = async (bagId: string, newQty: number) => {
    setUpdatingQtyId(bagId);
    await updateQuantity(bagId, newQty);
    setUpdatingQtyId(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative hover:bg-muted rounded-full transition-colors cursor-pointer">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 text-xs flex items-center justify-center rounded-full bg-primary text-primary-foreground">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full p-0" aria-describedby={undefined}>
        <SheetHeader className="border-b px-4 py-4 flex flex-row items-center justify-between">
          <SheetTitle className="text-lg sm:text-xl">Your Bag ({itemCount})</SheetTitle>
          <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            {/* <X className="h-4 w-4" /> */}
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        {/* EMPTY STATE */}
        {bagItems.length === 0 && !loading && (
          <div className="flex-1 flex flex-col justify-center items-center p-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">Your bag is empty.</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && bagItems.length === 0 && (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ITEMS */}
        {bagItems.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col px-4 py-2">
                {bagItems.map((item) => (
                  <div key={item._id} className="border-b pb-4 mb-4 last:border-0">
                    <div className="flex gap-3">
                      <div className="w-22 h-22 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.itemName}
                          height={80}
                          width={80}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-medium text-sm truncate">
                            {item.itemName}
                          </h3>

                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={deletingItemId === item._id}
                            className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
                          >
                            {deletingItemId === item._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 hover:text-destructive" />
                            )}
                          </button>
                        </div>

                        <button
                          onClick={() => setEditingNoteItem(item)}
                          className="text-xs text-left text-muted-foreground mt-1 italic hover:underline truncate-text cursor-pointer"
                        >
                          {item.note ? `Note: ${item.note}` : "+ Add note"}
                        </button>

                        <EditNoteDialog
                          open={!!editingNoteItem && editingNoteItem._id === item._id}
                          note={editingNoteItem?.note}
                          loading={savingNote}
                          onClose={() => setEditingNoteItem(null)}
                          onSave={handleSaveNote}
                        />

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-full">
                            {/* Decrease Quantity */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full w-8 h-8 p-0"
                              onClick={() => handleUpdateQuantity(item._id, item.qty - 1)}
                              disabled={updatingQtyId === item._id || item.qty <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>

                            {/* Quantity Display */}
                            <span className="w-8 text-center text-sm flex items-center justify-center">
                              {updatingQtyId === item._id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              ) : (
                                <span>{item.qty}</span>
                              )}
                            </span>

                            {/* Increase Quantity */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full w-8 h-8 p-0"
                              onClick={() => handleUpdateQuantity(item._id, item.qty + 1)}
                              disabled={updatingQtyId === item._id}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Total Amount */}
                          <span className="font-semibold text-sm">
                            Rs. {item.totalAmount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CUSTOMIZATION */}
                    {item.toppings?.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <button
                          className="flex justify-between items-center w-full text-left"
                          onClick={() => toggleCustomization(item._id)}
                        >
                          <span className="text-sm font-medium">
                            Customizations
                          </span>
                          {expandedItems[item._id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {expandedItems[item._id] && (
                          <div className="mt-2 space-y-4 bg-muted/50 rounded-md p-3">
                            {item.toppings.map((topping, i) => (
                              <div key={i} className="text-sm">
                                {topping.selectionType === "multiple" ? (
                                  <>
                                    <div className="flex justify-between items-center">
                                      <p className="text-md font-semibold">{topping.toppingTitle}</p>
                                      <button
                                        onClick={() => handleRemoveToppingGroup(item._id, topping._id)}
                                        disabled={deletingToppingId === topping._id}
                                        className="p-1 hover:bg-muted rounded-full"
                                      >
                                        {deletingToppingId === topping._id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3 h-3 hover:text-destructive cursor-pointer" />
                                        )}
                                      </button>
                                    </div>
                                    <span className="flex w-full border my-3"></span>
                                    <div className="mt-1 space-y-4">
                                      {topping.items.map((t: any, j: number) => (
                                        <div key={j} className="flex justify-between items-center">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => handleRemoveToppingItem(item._id, t._id)}
                                              disabled={deletingToppingId === t._id}
                                              className="p-1 bg-muted cursor-pointer rounded-full"
                                            >
                                              {deletingToppingId === t._id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <X className="w-3 h-3 hover:text-destructive" />
                                              )}
                                            </button>
                                            <span>{t.title}</span>
                                          </div>
                                          <span className="text-muted-foreground">Rs. {t.price}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div className="relative">
                                    <button
                                      onClick={() => handleRemoveToppingGroup(item._id, topping._id)}
                                      disabled={deletingToppingId === topping._id}
                                      className="absolute right-0 p-1 hover:bg-muted rounded-full z-10"
                                    >
                                      {deletingToppingId === topping._id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3 hover:text-destructive cursor-pointer" />
                                      )}
                                    </button>
                                    <SpicyLevel
                                      title={topping.toppingTitle}
                                      items={topping.items || []}
                                      selectedItem={topping.selectedItem} // initial selection
                                      onChange={async (index) => {
                                        const selected = topping.items[index]?.title;
                                        if (!selected) return;

                                        // Call context to update the bag item
                                        await updateSelectedTopping(item._id, topping.toppingTitle, selected);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t px-4 py-4 space-y-3 bg-background">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => setCheckoutOpen(true)}>
                Proceed to Checkout
              </Button>
              <CheckoutDialog
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
                onSubmit={(phone, paymentMethod, address, note) =>
                  addToOrder(address, phone, paymentMethod, note)
                }
                orderLoading={orderLoading}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Bag;