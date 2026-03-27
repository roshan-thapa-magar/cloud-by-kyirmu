import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Restaurant from "@/models/restaurantSchema";
import { pusherServer } from '@/lib/pusher-server';

// GET all restaurants
export async function GET() {
  try {
    await connectMongoDB();
    const restaurants = await Restaurant.find({});
    return NextResponse.json(restaurants, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants", details: error.message },
      { status: 500 }
    );
  }
}

// POST - create new restaurant
export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const data = await req.json();
    const { restaurantName, openingTime, closingTime, operatingDays, shopStatus } = data;

    if (!restaurantName || !openingTime) {
      return NextResponse.json(
        { error: "restaurantName and openingTime are required" },
        { status: 400 }
      );
    }

    const newRestaurant = await Restaurant.create({
      restaurantName,
      openingTime,
      closingTime: closingTime || null,
      operatingDays: operatingDays || [],
      shopStatus: shopStatus || "closed",
    });
    
    // Trigger Pusher event for restaurant creation
    try {
      await pusherServer.trigger('restaurants', 'restaurant-created', newRestaurant);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    return NextResponse.json(newRestaurant, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create restaurant", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - update restaurant
export async function PUT(req: NextRequest) {
  try {
    await connectMongoDB();
    const data = await req.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json(
        { error: "_id is required for updating a restaurant" },
        { status: 400 }
      );
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedRestaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Trigger Pusher event for restaurant update
    try {
      await pusherServer.trigger('restaurants', 'restaurant-updated', updatedRestaurant);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    return NextResponse.json(updatedRestaurant, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update restaurant", details: error.message },
      { status: 500 }
    );
  }
}