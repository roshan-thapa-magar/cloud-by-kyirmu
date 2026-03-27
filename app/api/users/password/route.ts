import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";

export async function PUT(req: NextRequest) {
  try {
    await connectMongoDB();

    const { userId, oldPassword, newPassword } = await req.json();

    // Validate input
    if (!userId || !newPassword) {
      return NextResponse.json(
        { message: "UserId and new password are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // If password already exists → verify old password
    if (user.password) {
      if (!oldPassword) {
        return NextResponse.json(
          { message: "Old password is required" },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return NextResponse.json(
          { message: "Old password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}