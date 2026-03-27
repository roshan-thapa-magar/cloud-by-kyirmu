import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Category from "@/models/categories";
import cloudinary from "@/lib/cloudinary";
import { pusherServer } from '@/lib/pusher-server';

interface Params {
  id: string;
}

// ------------------ UPDATE CATEGORY ------------------
export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const { categoryName, image } = await request.json();

    await connectMongoDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    // ✅ Check duplicate name
    if (categoryName && categoryName !== category.categoryName) {
      const existing = await Category.findOne({
        categoryName,
        _id: { $ne: id },
      });

      if (existing) {
        return NextResponse.json(
          { message: "Category name already exists" },
          { status: 400 }
        );
      }
    }

    // ✅ Instant DB update (no image yet)
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { categoryName },
      { new: true }
    );

    // ✅ Trigger Pusher event immediately
    try {
      await pusherServer.trigger('categories', 'category-updated', updatedCategory);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    // 🔥 Background image replace
    if (image && image !== category.image) {
      (async () => {
        try {
          // ❌ Delete old image
          if (category.image) {
            const parts = category.image.split("/");
            const fileName = parts.pop()?.split(".")[0];
            const folder = parts.pop();
            if (folder && fileName) {
              await cloudinary.uploader.destroy(`${folder}/${fileName}`, {
                invalidate: true,
              });
            }
          }

          // ✅ Upload new image
          const uploadedImage = await cloudinary.uploader.upload(image, {
            folder: "category",
          });

          const finalUpdated = await Category.findByIdAndUpdate(
            id,
            { image: uploadedImage.secure_url },
            { new: true }
          );

          // ✅ Trigger Pusher event after image ready
          try {
            await pusherServer.trigger('categories', 'category-image-updated', finalUpdated);
          } catch (err) {
            console.error("Failed to trigger Pusher image update event:", err);
          }

        } catch (err) {
          console.error("Background category image update failed:", err);
        }
      })();
    }

    return NextResponse.json(
      { message: "Category updated", category: updatedCategory },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Failed to update category", error: String(error) },
      { status: 500 }
    );
  }
}

// ------------------ DELETE CATEGORY ------------------
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    await connectMongoDB();

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    // ✅ Delete DB instantly
    await Category.findByIdAndDelete(id);

    // ✅ Trigger Pusher event immediately
    try {
      await pusherServer.trigger('categories', 'category-deleted', { _id: id });
    } catch (err) {
      console.error("Failed to trigger Pusher delete event:", err);
    }

    // 🔥 Background image delete
    if (category.image) {
      (async () => {
        try {
          const parts = category.image.split("/");
          const fileName = parts.pop()?.split(".")[0];
          const folder = parts.pop();

          if (folder && fileName) {
            await cloudinary.uploader.destroy(`${folder}/${fileName}`, {
              invalidate: true,
            });
          }
        } catch (err) {
          console.error("Background category image delete failed:", err);
        }
      })();
    }

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Failed to delete category", error: String(error) },
      { status: 500 }
    );
  }
}