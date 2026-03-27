import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Category from "@/models/categories";
import cloudinary from "@/lib/cloudinary";
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: NextRequest) {
  try {
    const { categoryName, image } = await request.json();
    await connectMongoDB();

    // ❌ Check duplicate
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return NextResponse.json(
        { message: "Category Name already exists" },
        { status: 400 }
      );
    }

    // ✅ Create instantly (no image yet)
    const newCategory = await Category.create({
      categoryName,
      image: "",
    });

    // ✅ Trigger Pusher event immediately
    try {
      await pusherServer.trigger('categories', 'category-created', newCategory);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    // 🔥 Background image upload
    if (image) {
      (async () => {
        try {
          const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: "category",
          });

          const updatedCategory = await Category.findByIdAndUpdate(
            newCategory._id,
            { image: uploadedImage.secure_url },
            { new: true }
          );

          // ✅ Trigger Pusher event when image ready
          try {
            await pusherServer.trigger('categories', 'category-image-updated', updatedCategory);
          } catch (err) {
            console.error("Failed to trigger Pusher image update event:", err);
          }

        } catch (err) {
          console.error("Background category image upload failed:", err);
        }
      })();
    }

    return NextResponse.json(
      { message: "Category created successfully", category: newCategory },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create category", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit"));

    const skip = (page - 1) * limit;

    const categories = await Category.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Category.countDocuments();

    return NextResponse.json(
      {
        message: "Categories fetched successfully",
        categories,
        total,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}