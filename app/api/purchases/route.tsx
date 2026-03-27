import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Purchase from "@/models/purchaseModel";
import cloudinary from "@/lib/cloudinary";
import { pusherServer } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();

    const formData = await req.formData();
    const imageFile = formData.get("billImage") as File | null;

    const purchase = await Purchase.create({
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
      billImage: "",
    });

    // ✅ Trigger Pusher event immediately (without image)
    try {
      await pusherServer.trigger('purchases', 'purchase-created', purchase);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    // 🔥 Background upload
    if (imageFile && imageFile.size > 0) {
      (async () => {
        try {
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const upload = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "purchase" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
              })
              .end(buffer);
          });

          const updatedPurchase = await Purchase.findByIdAndUpdate(
            purchase._id,
            { billImage: upload.secure_url },
            { new: true }
          );

          // ✅ Trigger Pusher event when image is ready
          try {
            await pusherServer.trigger('purchases', 'purchase-image-updated', updatedPurchase);
          } catch (err) {
            console.error("Failed to trigger image update event:", err);
          }

        } catch (err) {
          console.error("Background upload failed:", err);
        }
      })();
    }

    return NextResponse.json(purchase, { status: 201 });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { message: "POST Error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    const skip = (page - 1) * limit;

    // Build search query
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { item: { $regex: search, $options: "i" } },
          { supplier: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Get total count for pagination
    const total = await Purchase.countDocuments(query);

    // Get paginated purchases
    const purchases = await Purchase.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      purchases,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPurchases: total,
        limit,
      },
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { message: "GET Error", error: String(error) },
      { status: 500 }
    );
  }
}