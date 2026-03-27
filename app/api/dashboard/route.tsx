import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Category from "@/models/categories";
import Order from "@/models/Order";
import Items from "@/models/items";
import User from "@/models/user";
import Restaurant from "@/models/restaurantSchema";
import Purchase from "@/models/purchaseModel";

export async function GET(req: NextRequest) {
  try {
    await connectMongoDB();

    const url = new URL(req.url);
    const period = url.searchParams.get("period"); // daily, weekly, monthly, custom
    const startDate = url.searchParams.get("start");
    const endDate = url.searchParams.get("end");

    // ------------------- Date filter for Orders -------------------
    let orderFilter: any = {};
    const now = new Date();

    if (startDate && endDate) {
      orderFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (period === "daily") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      orderFilter.createdAt = { $gte: start, $lt: end };
    } else if (period === "weekly") {
      const day = now.getDay(); // 0=Sunday
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      orderFilter.createdAt = { $gte: start, $lt: end };
    } else if (period === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      orderFilter.createdAt = { $gte: start, $lt: end };
    }

    // ------------------- Total categories & items -------------------
    const totalCategories = await Category.countDocuments(); // No filter
    const totalItems = await Items.countDocuments(); // No filter

    // ------------------- Orders stats -------------------
    const orders = await Order.find(orderFilter);
    const runningOrders = orders.filter(o => o.status === "pending" || o.status === "preparing");
    const completedOrders = orders.filter(o => o.status === "completed");
    const cancelledOrders = orders.filter(o => o.status === "cancelled");

    const ordersStats = {
      running: { count: runningOrders.length, amount: runningOrders.reduce((sum, o) => sum + o.totalAmount, 0) },
      completed: { count: completedOrders.length, amount: completedOrders.reduce((sum, o) => sum + o.totalAmount, 0) },
      cancelled: { count: cancelledOrders.length, amount: cancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0) },
    };

    // ------------------- Total purchases -------------------
    const purchaseFilter: any = {};
    if (startDate && endDate) {
      purchaseFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (period === "daily") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      purchaseFilter.date = { $gte: start, $lt: end };
    } else if (period === "weekly") {
      const day = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      purchaseFilter.date = { $gte: start, $lt: end };
    } else if (period === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      purchaseFilter.date = { $gte: start, $lt: end };
    }

    const purchases = await Purchase.find(purchaseFilter);
    const totalPurchaseCount = purchases.length;
    const totalPurchaseAmount = purchases.reduce((sum, p) => sum + p.totalPrice, 0);

    // ------------------- Restaurant info -------------------
    const restaurants = await Restaurant.find({});
    const restaurantData = restaurants.map(r => ({
      name: r.restaurantName,
      openingTime: r.openingTime,
      closingTime: r.closingTime,
      operatingDays: r.operatingDays,
      shopStatus: r.shopStatus,
    }));

    // ------------------- Total users -------------------
    const totalUsers = await User.countDocuments({ role: "user" });

    return NextResponse.json({
      totalCategories,
      totalItems,
      totalUsers,
      ordersStats,
      totalPurchaseCount,
      totalPurchaseAmount,
      restaurants: restaurantData,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}