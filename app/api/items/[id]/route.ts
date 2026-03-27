import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Items from "@/models/items";
import cloudinary from "@/lib/cloudinary";
import { pusherServer } from '@/lib/pusher-server';

interface Params { id: string; }

// ---------------- GET ITEM ----------------
export async function GET(request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params;
    await connectMongoDB();
    const item = await Items.findById(id);
    if (!item) return NextResponse.json({ message: "Item not found" }, { status: 404 });

    return NextResponse.json({ message: "Item fetched successfully", item }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: "Failed to fetch item", error: (err as Error).message || "Unknown" }, 
      { status: 500 }
    );
  }
}

// ---------------- DELETE ITEM ----------------
export async function DELETE(request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params;
    await connectMongoDB();

    const item = await Items.findById(id);
    if (!item) return NextResponse.json({ message: "Item not found" }, { status: 404 });

    // Delete DB instantly
    await Items.findByIdAndDelete(id);

    // Trigger Pusher event immediately
    try {
      await pusherServer.trigger('items', 'item-deleted', { _id: id });
    } catch (err) {
      console.error("Failed to trigger Pusher delete event:", err);
    }

    // 🔥 Background delete image
    if (item.image) {
      (async () => {
        try {
          const parts = item.image.split("/");
          const fileName = parts.pop()?.split(".")[0];
          const folder = parts.pop();
          if (folder && fileName) {
            await cloudinary.uploader.destroy(`${folder}/${fileName}`, { invalidate: true });
          }
        } catch (err) {
          console.error("Background item image delete failed:", err);
        }
      })();
    }

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: "Failed to delete item", error: (err as Error).message || "Unknown" }, 
      { status: 500 }
    );
  }
}

// ---------------- UPDATE ITEM ----------------
export async function PUT(request: Request, context: { params: Promise<Params> }) {
  try {
    const { id } = await context.params;
    await connectMongoDB();

    const item = await Items.findById(id);
    if (!item) return NextResponse.json({ message: "Item not found" }, { status: 404 });

    const formData = await request.formData();

    const itemType = formData.get("itemType") as string;
    const itemName = formData.get("itemName") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const price = Number(formData.get("price"));
    const toppingsRaw = formData.get("toppings") as string;
    const newImage = formData.get("image") as File | null;

    const toppings = toppingsRaw ? JSON.parse(toppingsRaw) : [];

    // Check duplicate name
    if (itemName && itemName !== item.itemName) {
      const existing = await Items.findOne({ itemName, _id: { $ne: id } });
      if (existing) return NextResponse.json({ message: "Item name already exists" }, { status: 400 });
    }

    // ✅ Instant DB update (without new image)
    if (itemType) item.itemType = itemType;
    if (itemName) item.itemName = itemName;
    if (description !== undefined) item.description = description;
    if (!isNaN(price)) item.price = price;
    if (category) item.category = category;
    if (toppings) item.toppings = toppings;

    const updatedItem = await item.save();

    // ✅ Trigger Pusher event immediately
    try {
      await pusherServer.trigger('items', 'item-updated', updatedItem);
    } catch (err) {
      console.error("Failed to trigger Pusher update event:", err);
    }

    // 🔥 Background image update
    if (newImage && newImage.size > 0) {
      (async () => {
        try {
          // Delete old image
          if (item.image) {
            const parts = item.image.split("/");
            const fileName = parts.pop()?.split(".")[0];
            const folder = parts.pop();
            if (folder && fileName) {
              await cloudinary.uploader.destroy(`${folder}/${fileName}`, { invalidate: true });
            }
          }

          // Upload new image
          const bytes = await newImage.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const upload: any = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ folder: "item" }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }).end(buffer);
          });

          const finalItem = await Items.findByIdAndUpdate(
            id,
            { image: upload.secure_url },
            { new: true }
          );

          // ✅ Trigger Pusher event when image is ready
          try {
            await pusherServer.trigger('items', 'item-image-updated', finalItem);
          } catch (err) {
            console.error("Failed to trigger Pusher image update event:", err);
          }
        } catch (err) {
          console.error("Background item image update failed:", err);
        }
      })();
    }

    return NextResponse.json(
      { message: "Item updated successfully", item: updatedItem }, 
      { status: 200 }
    );

  } catch (err: unknown) {
    return NextResponse.json(
      { message: "Failed to update item", error: (err as Error).message || "Unknown" }, 
      { status: 500 }
    );
  }
}