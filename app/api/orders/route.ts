import BagItem from "@/models/BagItem";
import Order from "@/models/Order";
import { connectMongoDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppOrderDetails } from "@/lib/twilio";
import Restaurant from "@/models/restaurantSchema";
import { generateUniqueOrderId } from "@/services/orderService";
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: Request) {
  try {
    // 1. Parse request body
    const { userId, note, phone, address, paymentMethod } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), { status: 400 });
    }

    // 2. Connect to MongoDB
    await connectMongoDB();
    const orderId = await generateUniqueOrderId();

    // 3. Get restaurant (assuming single restaurant)
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return new Response(JSON.stringify({ error: "Restaurant not found" }), { status: 404 });
    }

    // 4. Check if restaurant is open
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })
    );

    // Current day full name (e.g., "tuesday")
    const today = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

    // Normalize operatingDays from DB to lowercase
    const operatingDays = restaurant.operatingDays.map((day: string) => day.toLowerCase());

    // Check shopStatus
    if (restaurant.shopStatus === "closed") {
      return new Response(JSON.stringify({ error: "Restaurant is currently closed" }), { status: 403 });
    }

    // Check operating days
    if (operatingDays.length > 0 && !operatingDays.includes(today)) {
      return new Response(JSON.stringify({ error: `Restaurant is closed today (${today})` }), { status: 403 });
    }

    // Check opening/closing time
    const { openingTime, closingTime } = restaurant;
    if (openingTime && closingTime) {
      const currentTime = now.toTimeString().slice(0, 5); // "HH:mm"
      if (currentTime < openingTime || currentTime > closingTime) {
        return new Response(
          JSON.stringify({
            error: `Restaurant is closed now (Open: ${openingTime} - ${closingTime})`,
          }),
          { status: 403 }
        );
      }
    }

    // 5. Fetch all bag items for the user
    const bagItems = await BagItem.find({ userId });
    if (!bagItems.length) {
      return new Response(JSON.stringify({ error: "No items in the bag" }), { status: 400 });
    }

    // 6. Calculate total amount
    const totalAmount = bagItems.reduce((sum, item) => sum + item.totalAmount, 0);

    // 7. Create a new order
    const order = new Order({
      orderId,
      userId,
      items: bagItems,
      totalAmount,
      note: note || "",
      phone: phone || "",
      address: address || "",
      paymentMethod: paymentMethod || "cash",
      status: "pending",
      paymentStatus: "pending",
    });

    const newOrder = await order.save();

    // 8. Send WhatsApp order details to owner
    try {
      await sendWhatsAppOrderDetails(newOrder);
    } catch (err) {
      console.error("Failed to send WhatsApp message:", err);
    }

    // 9. Clear the user's bag
    await BagItem.deleteMany({ userId });

    // 10. Trigger Pusher events for real-time updates
    try {
      // Notify admin dashboard about new order
      await pusherServer.trigger('admin-orders', 'new-order', newOrder);
      
      // Notify specific user about their order
      await pusherServer.trigger(`user-${userId}-orders`, 'order-created', newOrder);
    } catch (err) {
      console.error("Failed to trigger Pusher events:", err);
    }

    // 11. Return response
    return new Response(JSON.stringify({ success: true, order: newOrder }), { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Failed to create order" }), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    let query: any = {};
    if (userId) query.userId = userId;

    if (status) {
      const statuses = status.split(",");
      query.status = { $in: statuses };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error.message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}