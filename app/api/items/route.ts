import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Items from "@/models/items";
import cloudinary from "@/lib/cloudinary";
import Category from "@/models/categories";
import Order from "@/models/Order";
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const formData = await request.formData();

    const itemType = formData.get("itemType") as string;
    const itemName = formData.get("itemName") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const price = Number(formData.get("price"));
    const toppingsRaw = formData.get("toppings") as string;
    const imageFile = formData.get("image") as File | null;

    const toppings = toppingsRaw ? JSON.parse(toppingsRaw) : [];

    // ✅ Check duplicate
    const existingItem = await Items.findOne({ itemName });
    if (existingItem) {
      return NextResponse.json(
        { message: "Item Name already exists" },
        { status: 400 }
      );
    }

    // ✅ Create instantly (no image)
    const newItem = await Items.create({
      itemType,
      itemName,
      description,
      price,
      category,
      image: "",
      toppings,
    });

    // ✅ Trigger Pusher event immediately
    try {
      await pusherServer.trigger('items', 'item-created', newItem);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    // 🔥 Background image upload
    if (imageFile && imageFile.size > 0) {
      (async () => {
        try {
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const upload = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "item" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
              })
              .end(buffer);
          });

          const updatedItem = await Items.findByIdAndUpdate(
            newItem._id,
            { image: upload.secure_url },
            { new: true }
          );

          // ✅ Trigger Pusher event when image ready
          try {
            await pusherServer.trigger('items', 'item-image-updated', updatedItem);
          } catch (err) {
            console.error("Failed to trigger Pusher image update event:", err);
          }

        } catch (err) {
          console.error("Background item image upload failed:", err);
        }
      })();
    }

    return NextResponse.json(
      {
        message: "Item created successfully",
        item: newItem,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create item",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);

    const type = searchParams.get("itemType");
    const sort = searchParams.get("sort");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const cidParam = searchParams.get("cid"); // multiple category IDs
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    let query: any = {};

    // ---------------- Type filter ----------------
    if (type) query.itemType = type;

    // ---------------- Price range filter ----------------
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // ---------------- Category filter ----------------
    if (cidParam) {
      const cids = cidParam.split(",");
      const categories = await Category.find({ _id: { $in: cids } }).select("categoryName");
      const categoryNames = categories.map((cat) => cat.categoryName);
      query.category = { $in: categoryNames };
    }

    // Calculate skip for pagination only if page & limit exist
    const skip = page && limit ? (page - 1) * limit : undefined;

    // ---------------- Sorting ----------------
    let items: any[];
    let total: number;

    if (sort === "popular") {
      // Popular items: based on unique users
      const popularityAggregation = await Order.aggregate([
        { $unwind: "$items" },
        { $group: { _id: { itemId: "$items.itemId", userId: "$userId" } } },
        { $group: { _id: "$_id.itemId", userCount: { $sum: 1 } } },
        { $sort: { userCount: -1 } },
      ]);

      const popularityMap: Record<string, number> = {};
      popularityAggregation.forEach((pop) => {
        if (pop._id) popularityMap[pop._id.toString()] = pop.userCount;
      });

      const allItems = await Items.find(query);
      total = allItems.length;

      const itemsWithPopularity = allItems.map((item) => ({
        ...item.toObject(),
        userCount: popularityMap[item._id.toString()] || 0,
      }));
      itemsWithPopularity.sort((a, b) => b.userCount - a.userCount);

      // Apply pagination only if skip & limit exist
      items = skip !== undefined && limit !== undefined
        ? itemsWithPopularity.slice(skip, skip + limit)
        : itemsWithPopularity;

      return NextResponse.json(
        {
          message: "Items fetched successfully",
          items,
          pagination: {
            total,
            page,
            limit,
            totalPages: limit ? Math.ceil(total / limit) : undefined
          }
        },
        { status: 200 }
      );
    } else if (sort === "top_selling") {
      // Top-selling items: based on total qty sold
      const topSellingAggregation = await Order.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.itemId", totalSold: { $sum: "$items.qty" } } },
        { $sort: { totalSold: -1 } },
      ]);

      const topSellingMap: Record<string, number> = {};
      topSellingAggregation.forEach((pop) => {
        if (pop._id) topSellingMap[pop._id.toString()] = pop.totalSold;
      });

      const allItems = await Items.find(query);
      total = allItems.length;

      const itemsWithSales = allItems.map((item) => ({
        ...item.toObject(),
        totalSold: topSellingMap[item._id.toString()] || 0,
      }));
      itemsWithSales.sort((a, b) => b.totalSold - a.totalSold);

      // Apply pagination only if skip & limit exist
      items = skip !== undefined && limit !== undefined
        ? itemsWithSales.slice(skip, skip + limit)
        : itemsWithSales;

      return NextResponse.json(
        {
          message: "Items fetched successfully",
          items,
          pagination: {
            total,
            page,
            limit,
            totalPages: limit ? Math.ceil(total / limit) : undefined
          }
        },
        { status: 200 }
      );
    } else {
      // Default sorting: price_low / price_high
      let sortOption: any = {};
      if (sort === "price_low") sortOption = { price: 1 };
      else if (sort === "price_high") sortOption = { price: -1 };
      else sortOption = { createdAt: -1 };
      // Get total count for pagination
      total = await Items.countDocuments(query);

      let findQuery = Items.find(query).sort(sortOption);
      if (skip !== undefined && limit !== undefined) {
        findQuery = findQuery.skip(skip).limit(limit);
      }
      items = await findQuery;

      return NextResponse.json(
        {
          message: "Items fetched successfully",
          items,
          pagination: {
            total,
            page,
            limit,
            totalPages: limit ? Math.ceil(total / limit) : undefined
          }
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Failed to fetch items",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}