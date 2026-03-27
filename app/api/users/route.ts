import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import bcrypt from "bcryptjs";
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: Request) {
  try {
    const { name, email, password, role, image } = await request.json();

    await connectMongoDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "user";

    // ✅ Create user first with empty image
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      image: "",
    });

    // Trigger Pusher event for user creation
    try {
      await pusherServer.trigger('users', 'user-created', newUser);
    } catch (err) {
      console.error("Failed to trigger Pusher event:", err);
    }

    // 🔥 Background upload
    if (image) {
      (async () => {
        try {
          const upload = await cloudinary.uploader.upload(image, {
            folder: "users",
          });

          const updatedUser = await User.findByIdAndUpdate(newUser._id, {
            image: upload.secure_url,
          }, { new: true });

          // Trigger Pusher event for image update
          try {
            await pusherServer.trigger('users', 'user-image-updated', {
              _id: newUser._id,
              image: upload.secure_url,
              user: updatedUser
            });
          } catch (err) {
            console.error("Failed to trigger image update event:", err);
          }
        } catch (err) {
          console.error("Background user image upload failed:", err);
        }
      })();
    }

    return NextResponse.json(
      {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image, // empty initially
        role: newUser.role,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("User creation error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDB();

    const users = await User.find({}).select("-password");

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Fetch users error:", error);

    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}