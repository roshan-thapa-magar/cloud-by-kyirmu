"use client";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

interface ToppingItem {
  title: string;
  price: number;
}

interface ToppingSectionProps {
  title: string;
  items: ToppingItem[];
  onChange?: (data: {
    toppingTitle: string;
    selectionType: "multiple";
    totalSelectedToppingPrice: number;
    items: ToppingItem[];
    selectedItems: ToppingItem[];
  }) => void;
}

export default function ToppingSection({ title, items, onChange }: ToppingSectionProps) {
  const [selectedItems, setSelectedItems] = useState<ToppingItem[]>([]);

  const toggleItem = (item: ToppingItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.find(i => i.title === item.title);
      if (isSelected) return prev.filter(i => i.title !== item.title);
      return [...prev, item];
    });
  };

  useEffect(() => {
    if (onChange) {
      const total = selectedItems.reduce((sum, i) => sum + i.price, 0);
      onChange({
        toppingTitle: title,
        selectionType: "multiple",
        totalSelectedToppingPrice: total,
        items,
        selectedItems,
      });
    }
    // Only run when selectedItems or title changes
  }, [selectedItems, title, onChange]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold">{title}</h1>
      <FieldGroup className="space-y-4 !gap-0">
        {items.map((item, index) => {
          const checkboxId = `${title}-${index}`;
          const isChecked = selectedItems.some(i => i.title === item.title);
          return (
            <Field
              key={checkboxId}
              orientation="horizontal"
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id={checkboxId}
                  name={checkboxId}
                  checked={isChecked}
                  onCheckedChange={() => toggleItem(item)}
                />
                <FieldLabel htmlFor={checkboxId}>{item.title}</FieldLabel>
              </div>
              <span>Rs. {item.price}</span>
            </Field>
          );
        })}
      </FieldGroup>
    </div>
  );
}