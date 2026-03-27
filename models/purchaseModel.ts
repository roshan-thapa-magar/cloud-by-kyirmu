import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPurchase extends Document {
  date: Date;
  supplier: string;
  item: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: string;
  billImage: string;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    date: {
      type: Date,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    item: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Credit Card", "Bank Transfer", "Online Payment"],
    },
    billImage: {
      type: String, // store URL (Cloudinary / local)
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Purchase =
  models.Purchase || model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;