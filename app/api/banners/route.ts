import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import RestaurantBanner from "@/models/restaurantBannerSchema";
import cloudinary from "@/lib/cloudinary";
import { pusherServer } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const { image } = await req.json();

    const upload = await cloudinary.uploader.upload(image, {
      folder: "restaurant/banners",
    });

    const banner = await RestaurantBanner.create({
      url: upload.secure_url,
      public_id: upload.public_id,
    });

    // Trigger Pusher event for new banner
    try {
      await pusherServer.trigger('banners', 'banner-added', banner);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Banner uploaded successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error uploading banner:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDB();

    // Fetch all banners sorted by order, then by newest first
    const banners = await RestaurantBanner.find().sort({ order: 1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: banners,
      message: banners.length ? "Banners fetched successfully" : "No banners found",
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Fetch failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectMongoDB();
    const { banners } = await req.json(); // array of { id, order }

    // Update multiple banners in parallel
    const updatedBanners = await Promise.all(
      banners.map((b: { id: string; order: number }) =>
        RestaurantBanner.findByIdAndUpdate(
          b.id, 
          { order: b.order },
          { new: true } // Return updated document
        )
      )
    );

    // Trigger Pusher event for banner order update
    try {
      await pusherServer.trigger('banners', 'banners-reordered', updatedBanners);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Banner order updated",
      data: updatedBanners 
    });
  } catch (error) {
    console.error("Error updating banner order:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}