"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/* ================= TYPES ================= */
export type OrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";
export type PaymentMethod = "cash" | "card" | "online";

export interface EditOrderDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  order: {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
  };
  onSave: (updatedOrder: {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
  }) => void;
  onCancel: () => void;
}

/* ================= COMPONENT ================= */
export function EditOrderDialog({
  isOpen,
  isLoading,
  order,
  onSave,
  onCancel,
}: EditOrderDialogProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);

  // Sync with order prop when it changes
  useEffect(() => {
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setPaymentMethod(order.paymentMethod);
  }, [order]);

  const handleSave = () => {
    onSave({ status, paymentStatus, paymentMethod });
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isLoading && !open) onCancel();
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Order</AlertDialogTitle>
          <AlertDialogDescription>
            Update the status, payment status, and payment method for this order.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Form */}
        <div className="flex flex-col gap-4 mt-4">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="border rounded p-2"
            >
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="served">Served</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="border rounded p-2"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1">
            <label className="font-medium">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="border rounded p-2"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>

          <Button onClick={handleSave} disabled={isLoading} variant="default">
            {isLoading ? (
              <span className="flex items-center gap-2">
                Saving
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}