import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Purchase from "@/models/purchaseModel";
import cloudinary from "@/lib/cloudinary";
import { pusherServer } from '@/lib/pusher-server';

// Helper: extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url: string) => {
  try {
    const parts = url.split("/");
    const fileName = parts.pop()?.split(".")[0];
    const folder = parts.pop();
    if (!fileName || !folder) return null;
    return `${folder}/${fileName}`;
  } catch {
    return null;
  }
};

// Type for route context
type RouteContext = { params: Promise<{ id: string }> };

// ✅ GET BY ID
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params; // unwrap the promise
    await connectMongoDB();

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("GET BY ID Error:", error);
    return NextResponse.json(
      { message: "GET BY ID Error", error: String(error) },
      { status: 500 }
    );
  }
}

// ✅ UPDATE BY ID
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await connectMongoDB();

    const existing = await Purchase.findById(id);
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("billImage") as File | null;

    const updateData: any = {
      date: formData.get("date"),
      supplier: formData.get("supplier"),
      item: formData.get("item"),
      category: formData.get("category"),
      quantity: Number(formData.get("quantity")),
      unitPrice: Number(formData.get("unitPrice")),
      totalPrice:
        Number(formData.get("quantity")) *
        Number(formData.get("unitPrice")),
      paymentMethod: formData.get("paymentMethod"),
    };

    // ✅ Update instantly (without waiting for image)
    const updated = await Purchase.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // ✅ Trigger Pusher event for immediate update
    try {
      await pusherServer.trigger('purchases', 'purchase-updated', updated);
    } catch (err) {
      console.error("Failed to trigger update event:", err);
    }

    // 🔥 Background image replace
    if (imageFile && imageFile.size > 0) {
      (async () => {
        try {
          // ❌ delete old image
          if (existing.billImage) {
            const publicId = getPublicIdFromUrl(existing.billImage);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          }

          // ✅ upload new image
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const upload: any = await new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "purchase" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
              })
              .end(buffer);
          });

          const finalUpdated = await Purchase.findByIdAndUpdate(
            id,
            { billImage: upload.secure_url },
            { new: true }
          );

          // ✅ Trigger Pusher event when image ready
          try {
            await pusherServer.trigger('purchases', 'purchase-image-updated', finalUpdated);
          } catch (err) {
            console.error("Failed to trigger image update event:", err);
          }

        } catch (err) {
          console.error("Background image replace failed:", err);
        }
      })();
    }

    return NextResponse.json(updated);

  } catch (error) {
    console.error("UPDATE Error:", error);
    return NextResponse.json(
      { message: "UPDATE Error", error: String(error) },
      { status: 500 }
    );
  }
}

// ✅ DELETE BY ID
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await connectMongoDB();

    const existing = await Purchase.findById(id);
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // ✅ Delete from DB immediately
    await Purchase.findByIdAndDelete(id);

    // ✅ Trigger Pusher event for deletion
    try {
      await pusherServer.trigger('purchases', 'purchase-deleted', { _id: id });
    } catch (err) {
      console.error("Failed to trigger delete event:", err);
    }

    // 🔥 Background image delete
    if (existing.billImage) {
      (async () => {
        try {
          const publicId = getPublicIdFromUrl(existing.billImage);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.error("Background image delete failed:", err);
        }
      })();
    }

    return NextResponse.json({ message: "Deleted successfully" });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { message: "DELETE Error", error: String(error) },
      { status: 500 }
    );
  }
}