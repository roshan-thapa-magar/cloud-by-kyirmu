import Order from "@/models/Order";
import { customAlphabet } from "nanoid";

// Alphanumeric characters (0-9, A-Z), length 6
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

/**
 * Generate a unique 6-character order ID.
 * Checks the database to ensure uniqueness.
 */
export async function generateUniqueOrderId(): Promise<string> {
  let orderId = "";
  let exists = true;

  while (exists) {
    orderId = nanoid(); // Generate 6-character alphanumeric ID

    // Check if this ID already exists in the DB
    const existingOrder = await Order.exists({ orderId });
    exists = !!existingOrder;
  }

  return orderId;
}