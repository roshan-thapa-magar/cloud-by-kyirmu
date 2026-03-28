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

    // ✅ Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid user ID" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const body = await request.json();
    const { name, phone, address } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Format phone (Nepal format)
    let formattedPhone = phone;
    if (phone) {
      formattedPhone = phone.startsWith("+977")
        ? phone
        : "+977" + phone.replace(/^0/, "");
    }

    // ✅ Update only basic fields
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(formattedPhone && { phone: formattedPhone }),
        ...(address && { address }),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    // ✅ Trigger Pusher event
    try {
      await pusherServer.trigger("users", "user-updated", updatedUser);
    } catch (err) {
      console.error("Failed to trigger user update event:", err);
    }

    return NextResponse.json(
      {
        message: "User updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT USER ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}

// api/users/[id]/route.ts (the DELETE function only)

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
    
    // Get pending orders before deletion to trigger individual events
    const pendingOrders = await Order.find({
      userId: id,
      status: "pending",
    });
    
    // Delete pending orders
    await Order.deleteMany({
      userId: id,
      status: "pending",
    });
    
    // Trigger individual order deletion events for better UI updates
    for (const order of pendingOrders) {
      try {
        await pusherServer.trigger('admin-orders', 'order-deleted', order);
      } catch (err) {
        console.error(`Failed to trigger deletion event for order ${order._id}:`, err);
      }
    }
    
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


export async function PATCH(
  request: NextRequest,
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

    const { image } = await request.json();

    if (!image || !image.startsWith("data:image")) {
      return NextResponse.json(
        { message: "Invalid image format" },
        { status: 400 }
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Delete old image (if exists)
    if (user.image) {
      try {
        const segments = user.image.split("/");
        const filename = segments[segments.length - 1].split(".")[0];
        const folder = "users";

        await cloudinary.uploader.destroy(`${folder}/${filename}`);
      } catch (err) {
        console.warn("Old image deletion failed:", err);
      }
    }

    // ✅ Upload new image
    const uploadedImage = await cloudinary.uploader.upload(image, {
      folder: "users",
      public_id: id, // overwrite same image
      overwrite: true,
      quality: "auto",
    });

    // ✅ Update DB
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { image: uploadedImage.secure_url },
      { new: true }
    ).select("-password");

    // ✅ Trigger Pusher event
    try {
      await pusherServer.trigger("users", "user-image-updated", {
        _id: id,
        image: uploadedImage.secure_url,
        user: updatedUser,
      });
    } catch (err) {
      console.error("Pusher trigger failed:", err);
    }

    return NextResponse.json(
      {
        message: "User image updated successfully",
        image: uploadedImage.secure_url,
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH USER IMAGE ERROR:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}