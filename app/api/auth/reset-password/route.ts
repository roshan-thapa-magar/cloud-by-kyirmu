import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import OTP from "@/models/otp";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { phone, newPassword } = await request.json();

    if (!phone || !newPassword) {
      return NextResponse.json(
        { message: "Phone and new password are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Optionally check if OTP exists for this phone before allowing password reset
    const otpRecord = await OTP.findOne({ phone });
    if (!otpRecord) {
      return NextResponse.json({ message: "OTP not verified" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findOneAndUpdate(
      { phone },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete used OTP after successful password reset
    await OTP.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Reset Password error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}