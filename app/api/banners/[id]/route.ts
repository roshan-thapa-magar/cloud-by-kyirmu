import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import RestaurantBanner from "@/models/restaurantBannerSchema";
import cloudinary from "@/lib/cloudinary";
import { pusherServer } from '@/lib/pusher-server';

// Next.js 16 expects params as Promise
interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET banner by ID
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await connectMongoDB();

    const { id } = await context.params;
    const banner = await RestaurantBanner.findById(id);

    if (!banner) {
      return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Fetch failed" },
      { status: 500 }
    );
  }
}

// PUT (update) banner by ID
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await connectMongoDB();

    const { id } = await context.params;
    const { image } = await req.json();

    const banner = await RestaurantBanner.findById(id);
    if (!banner) {
      return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
    }

    if (image) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(banner.public_id);
      
      // Upload new image
      const upload = await cloudinary.uploader.upload(image, {
        folder: "restaurant/banners",
      });
      
      banner.url = upload.secure_url;
      banner.public_id = upload.public_id;
    }

    const updatedBanner = await banner.save();

    // Trigger Pusher event for banner update
    try {
      await pusherServer.trigger('banners', 'banner-updated', updatedBanner);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Banner updated", 
      data: updatedBanner 
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}

// DELETE banner by ID
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await connectMongoDB();

    const { id } = await context.params;
    const banner = await RestaurantBanner.findById(id);
    
    if (!banner) {
      return NextResponse.json({ success: false, message: "Banner not found" }, { status: 404 });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(banner.public_id);
    
    // Delete banner from database
    const deletedBanner = await banner.deleteOne();

    // Trigger Pusher event for banner deletion
    try {
      await pusherServer.trigger('banners', 'banner-deleted', { id: banner._id });
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Banner deleted",
      data: deletedBanner 
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}