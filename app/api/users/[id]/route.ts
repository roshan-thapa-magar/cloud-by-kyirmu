import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import cloudinary from "@/lib/cloudinary";
import BagItem from "@/models/BagItem";
import Order from "@/models/Order";
import { pusherServer } from '@/lib/pusher-server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // ✅ Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // ✅ Find user
    const user = await User.findById(id).select("-password");

    // ✅ If user not found (deleted)
    if (!user) {
      return NextResponse.json(
        { message: "This user has deleted his account" },
        { status: 404 }
      );
    }

    // ✅ Success
    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.error("GET USER ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    await connectMongoDB();

    const body = await request.json();
    const { name, image, phone, address } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Handle phone formatting
    let formattedPhone = phone;
    if (phone && !phone.startsWith("+977")) {
      formattedPhone = "+977" + phone.replace(/^0/, "");
    }

    // Update user fields immediately
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(formattedPhone && { phone: formattedPhone }),
        ...(address && { address }),
      },
      { new: true, runValidators: true }
    ).select("-password");

    // Trigger Pusher event for user update
    try {
      await pusherServer.trigger('users', 'user-updated', updatedUser);
    } catch (err) {
      console.error("Failed to trigger user update event:", err);
    }

    // Background image update
    if (image && image.startsWith("data:image")) {
      (async () => {
        try {
          // Delete old image
          if (user.image) {
            const segments = user.image.split("/");
            const filename = segments[segments.length - 1].split(".")[0];
            const folder = "users";
            await cloudinary.uploader.destroy(`${folder}/${filename}`);
          }

          // Upload new image
          const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: "users",
            public_id: id,
            overwrite: true,
            quality: "auto",
          });

          const finalUpdatedUser = await User.findByIdAndUpdate(
            id, 
            { image: uploadedImage.secure_url },
            { new: true }
          ).select("-password");

          // Trigger Pusher event for image update
          try {
            await pusherServer.trigger('users', 'user-image-updated', {
              _id: id,
              image: uploadedImage.secure_url,
              user: finalUpdatedUser
            });
          } catch (err) {
            console.error("Failed to trigger image update event:", err);
          }
        } catch (err) {
          console.error("Background user image upload failed:", err);
        }
      })();
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    }, { status: 200 });
  } catch (error) {
    console.error("PUT USER ERROR:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
    }

    await connectMongoDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Check for blocking orders
    const allowedStatuses = ["pending", "cancelled", "completed"];
    const blockingOrders = await Order.find({
      userId: id,
      status: { $nin: allowedStatuses },
    });

    if (blockingOrders.length > 0) {
      const statuses = [...new Set(blockingOrders.map(o => o.status))];
      return NextResponse.json({
        success: false,
        message: `Cannot delete user: orders with status ${statuses.join(", ")}`,
      }, { status: 400 });
    }
    
    await Order.deleteMany({
      userId: id,
      status: "pending",
    });
    
    // Background image & bag items deletion
    (async () => {
      try {
        // Delete user image
        if (user.image) {
          const segments = user.image.split("/");
          const filename = segments[segments.length - 1].split(".")[0];
          const folder = "users";
          await cloudinary.uploader.destroy(`${folder}/${filename}`);
        }

        // Delete bag items and their images
        const bagItems = await BagItem.find({ userId: id });
        for (const item of bagItems) {
          if (item.image) {
            const segments = item.image.split("/");
            const filename = segments[segments.length - 1].split(".")[0];
            const folder = "bagitems";
            await cloudinary.uploader.destroy(`${folder}/${filename}`);
          }
        }
        await BagItem.deleteMany({ userId: id });
      } catch (err) {
        console.warn("Background deletion failed:", err);
      }
    })();

    // Delete user document
    await User.findByIdAndDelete(id);

    // Trigger Pusher event for user deletion
    try {
      await pusherServer.trigger('users', 'user-deleted', { 
        _id: id,
        userId: id 
      });
    } catch (err) {
      console.error("Failed to trigger user deletion event:", err);
    }

    return NextResponse.json({
      success: true,
      message: "User and related items deleted successfully",
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return NextResponse.json({ success: false, message: "Server error", error: String(error) }, { status: 500 });
  }
}