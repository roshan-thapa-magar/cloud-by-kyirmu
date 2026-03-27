import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import RestaurantLogo from "@/models/restaurantLogoSchema";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    await connectMongoDB();
    const logo = await RestaurantLogo.findOne();
    if (!logo) return NextResponse.json({ success: false, message: "No logo found" });
    return NextResponse.json({ success: true, data: logo });
  } catch (error) {
    return NextResponse.json({ success: false, message: error });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const { image } = await req.json();

    const existing = await RestaurantLogo.findOne();
    if (existing) return NextResponse.json({ success: false, message: "Logo exists. Use PUT." });

    const upload = await cloudinary.uploader.upload(image, { folder: "restaurant/logo" });

    const logo = await RestaurantLogo.create({ url: upload.secure_url, public_id: upload.public_id });

    return NextResponse.json({ success: true, message: "Logo uploaded successfully", data: logo });
  } catch (error) {
    return NextResponse.json({ success: false, message: error });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectMongoDB();
    const { image } = await req.json();

    const logo = await RestaurantLogo.findOne();
    if (!logo) return NextResponse.json({ success: false, message: "No logo found. Use POST." });

    // Delete old logo from Cloudinary
    await cloudinary.uploader.destroy(logo.public_id);

    const upload = await cloudinary.uploader.upload(image, { folder: "restaurant/logo" });

    logo.url = upload.secure_url;
    logo.public_id = upload.public_id;

    await logo.save();

    return NextResponse.json({ success: true, message: "Logo updated successfully", data: logo });
  } catch (error) {
    return NextResponse.json({ success: false, message: error });
  }
}

export async function DELETE() {
  try {
    await connectMongoDB();
    const logo = await RestaurantLogo.findOne();
    if (!logo) return NextResponse.json({ success: false, message: "No logo found" });

    await cloudinary.uploader.destroy(logo.public_id);
    await RestaurantLogo.deleteOne({ _id: logo._id });

    return NextResponse.json({ success: true, message: "Logo deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error });
  }
}
