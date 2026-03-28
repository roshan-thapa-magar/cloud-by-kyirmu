import { NextResponse } from "next/server";
import Order from "@/models/Order";
import { connectMongoDB } from "@/lib/mongodb";
import { pusherServer } from '@/lib/pusher-server';

interface Params {
  id: string; // this is either userId or orderId depending on the endpoint
}

export async function GET(req: Request, context: { params: Promise<Params> }) {
  try {
    const { id: userId } = await context.params;
    await connectMongoDB();

    // Fetch all orders for this user
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Orders fetched successfully", orders },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to fetch orders", error: errMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: { params: Promise<Params> }) {
  try {
    const { id: orderId } = await context.params;
    await connectMongoDB();

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);
    
    // Trigger Pusher events for order deletion
    try {
      // Notify admin dashboard
      await pusherServer.trigger('admin-orders', 'order-deleted', deletedOrder);
      
      // Notify specific user
      await pusherServer.trigger(`user-${order.userId}-orders`, 'order-deleted', deletedOrder);
    } catch (err) {
      console.error("Failed to trigger Pusher delete events:", err);
    }
    
    return NextResponse.json(
      { message: `Order ${deletedOrder._id} has been deleted successfully` },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to delete order", error: errMsg },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: { params: Promise<Params> }) {
  try {
    const { id: orderId } = await context.params;
    await connectMongoDB();

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { message: `Only pending orders can be cancelled. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Update status to cancelled
    order.status = "cancelled";
    const updatedOrder = await order.save();
    
    // Trigger Pusher events for status update
    try {
      // Notify admin dashboard
      await pusherServer.trigger('admin-orders', 'order-status-updated', updatedOrder);
      
      // Notify specific user
      await pusherServer.trigger(`user-${order.userId}-orders`, 'order-status-updated', updatedOrder);
    } catch (err) {
      console.error("Failed to trigger Pusher status update events:", err);
    }

    return NextResponse.json(
      { message: "Order status updated to cancelled", order: updatedOrder },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to update order status", error: errMsg },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: { params: Promise<Params> }) {
  try {
    const { id: orderId } = await context.params;
    await connectMongoDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, paymentStatus, paymentMethod } = body;

    // Only update these three fields
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;

    const updatedOrder = await order.save();
    
    // Trigger Pusher events for order update
    try {
      // Notify admin dashboard
      await pusherServer.trigger('admin-orders', 'order-updated', updatedOrder);
      
      // Notify specific user
      await pusherServer.trigger(`user-${order.userId}-orders`, 'order-updated', updatedOrder);
    } catch (err) {
      console.error("Failed to trigger Pusher update events:", err);
    }

    return NextResponse.json(
      { message: "Order updated successfully", order: updatedOrder },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to update order", error: errMsg },
      { status: 500 }
    );
  }
}