import { NextResponse } from "next/server";
import Order from "@/models/Order";
import { connectMongoDB } from "@/lib/mongodb";

interface Params {
  id: string;
}

export async function GET(req: Request, context: { params: Promise<Params> }) {
  try {
    const { id: userId } = await context.params;

    await connectMongoDB();

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Pagination params
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "7");
    const skip = (page - 1) * limit;

    const statusParam = searchParams.get("status"); // optional status filter
    let statusFilter: string[] | undefined;
    if (statusParam) {
      statusFilter = statusParam.split(","); // e.g., "pending,completed"
    }

    // ⏱️ Time 10 minutes ago
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Build query
    const query: any = { userId };
    if (statusFilter) {
      query.status = { $in: statusFilter };
    } else {
      query.$or = [
        { status: { $in: ["pending", "processing", "preparing", "served", "shipped"] } },
        { status: { $in: ["completed", "cancelled"] }, updatedAt: { $gte: tenMinutesAgo } },
      ];
    }

    // Total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Fetch orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("orderId status paymentStatus paymentMethod totalAmount phone address createdAt updatedAt items");

    // Return response with pagination info
    return NextResponse.json({
      message: "Orders fetched successfully",
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Failed to fetch orders",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}