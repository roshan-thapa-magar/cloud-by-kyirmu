"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ShoppingBag,
  Plus,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  Tag,
  Circle,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

interface ToppingItem {
  title: string;
  price: number;
}

interface ToppingGroup {
  toppingTitle: string;
  selectionType: "single" | "multiple";
  selectedItem?: string;
  items: ToppingItem[];
  totalSelectedToppingPrice?: number;
}

interface OrderItem {
  itemId?: string;
  itemName: string;
  price: number;
  qty: number;
  totalAmount: number;
  note?: string;
  image?: string;
  toppings?: ToppingGroup[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  orderTotal?: number;
}

export function ViewItemsDialog({ isOpen, onClose, items, orderTotal }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  if (!items.length) return null;

  const currentItem = items[currentIndex];
  const displayTotal = orderTotal ?? items.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const toppings = currentItem.toppings ?? [];

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(items.length - 1, i + 1));
  const getSelectedIndex = (group: ToppingGroup) =>
    group.items.findIndex((i) => i.title === group.selectedItem);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl">Order Items</DialogTitle>
          </div>
          <Badge variant="secondary" className="text-sm">
            {items.length} Item{items.length > 1 ? "s" : ""}
          </Badge>
        </DialogHeader>

        {/* Slider Navigation */}
        {items.length > 1 && (
          <div className="px-6 py-4 bg-muted border-b flex items-center gap-4">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="p-1 rounded-full hover:bg-muted/50 disabled:opacity-50 transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Item {currentIndex + 1} of {items.length}
                </span>
                <span>{currentItem.itemName}</span>
              </div>
              <Slider
                value={[currentIndex]}
                onValueChange={(val) => setCurrentIndex(val[0])}
                min={0}
                max={items.length - 1}
                step={1}
                className="w-full [&>span:first-child]:bg-primary/20 [&_[role=slider]]:bg-primary [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 transition-all"
              />
            </div>

            <button
              onClick={goNext}
              disabled={currentIndex === items.length - 1}
              className="p-1 rounded-full hover:bg-muted/50 disabled:opacity-50 transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Scrollable Items */}
        <ScrollArea className="max-h-[500px] px-6 py-4 space-y-4">
          <div className="bg-card rounded-xl border border-border hover:border-primary hover:shadow-md transition">
            <div className="p-4">
              <div className="flex justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{currentItem.itemName}</h3>
                    <Badge variant="outline" className="text-sm">
                      Qty: {currentItem.qty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground/70">{currentItem.price.toFixed(2)} each</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                  <div className="font-bold text-primary">{currentItem.totalAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* Note */}
              {currentItem.note && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-muted p-3 rounded-lg border border-amber-200 dark:border-none">
                  <FileText className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Note</span>
                    <p className="text-sm text-amber-700">{currentItem.note}</p>
                  </div>
                </div>
              )}

              {/* Toppings */}
              {toppings.length > 0 && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground/70">Customizations</span>
                  </div>

                  {toppings.map((topping, i) => (
                    <div key={i} className="bg-muted rounded-lg p-4">
                      <div className="flex justify-between mb-3 items-center">
                        <div className="flex items-center gap-2">
                          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground/80">{topping.toppingTitle}</span>
                          <Badge variant="secondary" className="text-xs">
                            {topping.selectionType === "single" ? "Single Choice" : "Multiple"}
                          </Badge>
                        </div>
                        {topping.totalSelectedToppingPrice && (
                          <span className="text-xs font-medium text-primary">
                            +{topping.totalSelectedToppingPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Single Choice Visual Slider with Highlighted Selected Item */}
                      {topping.selectionType === "single" && topping.items.length > 1 && (
                        <div className="pt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            {topping.items.map((item, index) => (
                              <span
                                key={index}
                                className={`${item.title === topping.selectedItem
                                    ? "font-semibold text-primary"
                                    : "text-muted-foreground"
                                  }`}
                              >
                                {item.title}
                              </span>
                            ))}
                          </div>

                          {/* Optional: Slider below for visual representation */}
                          <Slider
                            value={[
                              ((getSelectedIndex(topping) ?? 0) / (topping.items.length - 1)) * 100,
                            ]}
                            max={100}
                            step={1}
                            disabled
                            className="mx-auto w-full"
                          />
                        </div>
                      )}
                      {/* Multiple Choice Items */}
                      {topping.selectionType === "multiple" && (
                        <div className="ml-2 space-y-2">
                          {topping.items.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm p-2 hover:bg-card rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Circle className="h-2 w-2 fill-current text-muted-foreground" />
                                <span className="text-foreground/70">{t.title}</span>
                              </div>
                              <span className="font-medium text-foreground/80">+{t.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-muted px-6 py-4 flex justify-between items-center rounded-b-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-foreground">{displayTotal.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {totalQty} total quantity
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Viewing item {currentIndex + 1} of {items.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}