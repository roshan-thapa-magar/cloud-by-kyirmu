import mongoose, { Schema, model, models, Document } from "mongoose";

// ------------------ Topping Item Schema ------------------
const toppingItemSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, default: 0 },
});

// ------------------ Topping Group Schema ------------------
const toppingSchema = new Schema({
  toppingTitle: { type: String, required: true },
  selectionType: { type: String, enum: ["single", "multiple"], default: "single" },
  selectedItem: { type: String, default: "" },
  totalSelectedToppingPrice: { type: Number, default: 0 },
  items: { type: [toppingItemSchema], default: [] },
});

// ------------------ Topping Interfaces ------------------
export interface IToppingItem {
  title: string;
  price: number;
}

export interface ITopping {
  toppingTitle: string;
  selectionType: "single" | "multiple";
  selectedItem: string;
  totalSelectedToppingPrice: number;
  items: IToppingItem[];
}

// ------------------ Bag Item Interface ------------------
export interface IBagItem extends Document {
  userId: string;
  itemId?: string;
  itemName: string;
  price: number;
  image?: string;
  qty: number;
  totalAmount: number;
  note?: string;
  toppings: ITopping[];
  createdAt: Date;
  updatedAt: Date;
}

// ------------------ Bag Item Schema ------------------
export const bagItemSchema = new Schema<IBagItem>(
  {
    userId: { type: String, required: true },
    itemId: { type: String },
    itemName: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
    qty: { type: Number, default: 1 },
    totalAmount: { type: Number, default: 0 },
    note: { type: String, default: "" },
    toppings: { type: [toppingSchema], default: [] },
  },
  { timestamps: true }
);

// ------------------ Bag Item Model ------------------
const BagItem = models.BagItem || model<IBagItem>("BagItem", bagItemSchema);

export default BagItem;