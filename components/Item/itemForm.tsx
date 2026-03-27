"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ToppingItem = { id: string; name: string; price: string };
type ToppingGroup = { id: string; title: string; selectionType: "single" | "multiple"; items: ToppingItem[] };

type ItemFormProps = {
  title: string;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  defaultValues?: any;
  categories: { _id: string; categoryName: string }[];
};

export function ItemForm({ title, onClose, onSubmit, defaultValues, categories }: ItemFormProps) {
  const [name, setName] = useState(defaultValues?.itemName || "");
  const [type, setType] = useState(defaultValues?.itemType || "");
  const [category, setCategory] = useState(defaultValues?.category || "");
  const [price, setPrice] = useState(defaultValues?.price || 0);
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState(defaultValues?.image || null);
  const [groups, setGroups] = useState<ToppingGroup[]>(
    defaultValues?.toppings?.map((t: any) => ({
      id: crypto.randomUUID(),
      title: t.toppingTitle,
      selectionType: t.selectionType,
      items: t.items.map((i: any) => ({ id: crypto.randomUUID(), name: i.title, price: i.price.toString() })),
    })) || []
  );
  const [loading, setLoading] = useState(false);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  /* ======= Toppings handlers ======= */
  const addGroup = () => {
    if (groups.length >= 10) return;
    setGroups([...groups, { id: crypto.randomUUID(), title: "", selectionType: "multiple", items: [] }]);
  };
  const removeGroup = (id: string) => setGroups(groups.filter((g) => g.id !== id));
  const addItem = (groupId: string) =>
    setGroups(groups.map((g) =>
      g.id === groupId && g.items.length < 10
        ? { ...g, items: [...g.items, { id: crypto.randomUUID(), name: "", price: "" }] }
        : g
    ));
  const removeItem = (groupId: string, itemId: string) =>
    setGroups(groups.map((g) =>
      g.id === groupId ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g
    ));
  const updateGroupTitle = (groupId: string, value: string) =>
    setGroups(groups.map((g) => (g.id === groupId ? { ...g, title: value } : g)));
  const updateItemField = (groupId: string, itemId: string, field: "name" | "price", value: string) =>
    setGroups(groups.map((g) =>
      g.id === groupId ? { ...g, items: g.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)) } : g
    ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      itemName: name,
      itemType: type,
      category,
      price,
      description,
      toppings: groups.map((g) => ({
        toppingTitle: g.title,
        selectionType: g.selectionType,
        items: g.items.map((i) => ({ title: i.name, price: parseFloat(i.price) || 0 })),
      })),
      image,
    };
    try {
    setLoading(true);
    await onSubmit(payload);
  } finally {
    setLoading(false);
  }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
            <DialogDescription>Add or edit an item.</DialogDescription>
          </DialogHeader>

          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Item Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cheese Burger" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType} required >
                  <SelectTrigger><SelectValue placeholder="Select item type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>

                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat.categoryName}>
                        {cat.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Price</Label>
              <Input type="number" value={price || ""} onChange={(e) => setPrice(parseFloat(e.target.value))} required/>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Item Image</Label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="border rounded p-2"/>
              {preview && <img src={preview} className="mt-2 w-32 h-32 object-cover rounded-md border" />}
            </div>
          </div>

          <Separator />

          {/* Toppings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Toppings</h3>
              <Button type="button" size="sm" variant="secondary" onClick={addGroup} disabled={groups.length >= 10}>
                <Plus className="w-4 h-4 mr-2" /> Add Group
              </Button>
            </div>

            {groups.map((group) => (
              <div key={group.id} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Input placeholder="Group title" value={group.title} onChange={(e) => updateGroupTitle(group.id, e.target.value)} required />
                  <Select value={group.selectionType} onValueChange={(v) =>
                    setGroups(groups.map((g) =>
                      g.id === group.id ? { ...g, selectionType: v as "single" | "multiple" } : g
                    ))
                  }>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="multiple">Multiple</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" type="button" onClick={() => removeGroup(group.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {group.items.map((i) => (
                    <div key={i.id} className="flex items-center gap-2">
                      <Button size="icon" variant="ghost"><GripVertical className="w-4 h-4 text-muted-foreground" /></Button>
                      <Input placeholder="Item name" value={i.name} onChange={(e) => updateItemField(group.id, i.id, "name", e.target.value)} required/>
                      {group.selectionType === "multiple" && (
                        <Input type="number" placeholder="Price" className="w-28" value={i.price} onChange={(e) => updateItemField(group.id, i.id, "price", e.target.value)} required/>
                      )}
                      <Button size="icon" variant="ghost" type="button" onClick={() => removeItem(group.id, i.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => addItem(group.id)} disabled={group.items.length >= 10}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading || !type || !category}>{loading ? <span className="flex items-center gap-2">
                    Saving
                    <Loader2 className="h-4 w-4 animate-spin" />
                </span> : "Submit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}