import mongoose, { Schema, model, models, Document } from "mongoose";
import { bagItemSchema, IBagItem } from "./BagItem";

// ------------------ Order Interface ------------------
export interface IOrder extends Document {
  orderId: string;
  userId: string;
  items: IBagItem[];
  totalAmount: number;
  status: "pending" | "preparing" | "served" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod?: "cash" | "card" | "online"; // new field
  note?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ------------------ Order Schema ------------------
const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true },
    userId: { type: String, required: true },
    items: { type: [bagItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "served", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online"],
      default: "cash", // default payment method
    },
    note: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

// ------------------ Order Model ------------------
const Order = models.Order || model<IOrder>("Order", orderSchema);

export default Order;