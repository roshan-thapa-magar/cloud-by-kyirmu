"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import moment from "moment";

interface AddEditPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData, isEdit?: boolean) => void;
  purchase?: any;
  loading?: boolean;
}

export function AddEditPurchaseDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  purchase, 
  loading 
}: AddEditPurchaseDialogProps) {
  const [formValues, setFormValues] = useState({
    date: "",
    supplier: "",
    item: "",
    category: "",
    quantity: "",
    unitPrice: "",
    paymentMethod: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  // Reset form when dialog opens/closes or purchase changes
  useEffect(() => {
    if (purchase) {
      // Edit mode - populate with purchase data
      // Format the date to YYYY-MM-DD for the input field
      const formattedDate = purchase.date 
        ? moment(purchase.date).format("YYYY-MM-DD") 
        : "";
      
      setFormValues({
        date: formattedDate,
        supplier: purchase.supplier || "",
        item: purchase.item || "",
        category: purchase.category || "",
        quantity: purchase.quantity?.toString() || "",
        unitPrice: purchase.unitPrice?.toString() || "",
        paymentMethod: purchase.paymentMethod || "",
      });
      setPreview(purchase.billImage || "");
      setFile(null);
    } else {
      // Add mode - reset all fields
      setFormValues({
        date: "",
        supplier: "",
        item: "",
        category: "",
        quantity: "",
        unitPrice: "",
        paymentMethod: "",
      });
      setFile(null);
      setPreview("");
    }
  }, [purchase, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormValues(prev => ({ ...prev, paymentMethod: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formValues.date || !formValues.supplier || !formValues.item || 
        !formValues.category || !formValues.quantity || !formValues.unitPrice || 
        !formValues.paymentMethod) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate file for new purchases
    if (!purchase && !file) {
      toast.error("Please upload a bill image");
      return;
    }

    const data = new FormData();
    data.append("date", formValues.date);
    data.append("supplier", formValues.supplier);
    data.append("item", formValues.item);
    data.append("category", formValues.category);
    data.append("quantity", formValues.quantity);
    data.append("unitPrice", formValues.unitPrice);
    data.append("paymentMethod", formValues.paymentMethod);

    if (file) {
      data.append("billImage", file);
    }

    onSave(data, !!purchase);
  };

  const handleClose = () => {
    // Reset form when closing
    setFormValues({
      date: "",
      supplier: "",
      item: "",
      category: "",
      quantity: "",
      unitPrice: "",
      paymentMethod: "",
    });
    setFile(null);
    setPreview("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchase ? "Edit Purchase" : "Add Purchase"}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2  gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date *</Label>
            <Input 
              id="date"
              type="date" 
              name="date" 
              value={formValues.date} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="supplier">Supplier *</Label>
            <Input 
              id="supplier"
              name="supplier" 
              value={formValues.supplier} 
              onChange={handleChange} 
              required 
              placeholder="Enter supplier name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="item">Item *</Label>
            <Input 
              id="item"
              name="item" 
              value={formValues.item} 
              onChange={handleChange} 
              required 
              placeholder="Enter item name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Category *</Label>
            <Input 
              id="category"
              name="category" 
              value={formValues.category} 
              onChange={handleChange} 
              required 
              placeholder="Enter category"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input 
              id="quantity"
              type="number" 
              name="quantity" 
              value={formValues.quantity} 
              onChange={handleChange} 
              required 
              min={1} 
              placeholder="Enter quantity"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="unitPrice">Unit Price *</Label>
            <Input 
              id="unitPrice"
              type="number" 
              name="unitPrice" 
              value={formValues.unitPrice} 
              onChange={handleChange} 
              required 
              min={0} 
              step={0.01} 
              placeholder="Enter unit price"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select 
              value={formValues.paymentMethod} 
              onValueChange={handleSelectChange}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Online Payment">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="billImage">
              Bill Image {!purchase && '*'}
            </Label>
            <Input 
              id="billImage"
              type="file" 
              onChange={handleFileChange} 
              accept="image/*"
            />
            {preview && (
              <div className="mt-2">
                <img 
                  src={preview} 
                  className="w-32 h-32 object-cover rounded-md border" 
                  alt="preview" 
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="secondary" 
            onClick={handleClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? "Saving..." : (purchase ? "Update" : "Add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}