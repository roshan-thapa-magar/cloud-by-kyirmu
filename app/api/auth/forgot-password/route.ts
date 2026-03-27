import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import OTP from "@/models/otp";
import { sendWhatsAppOTP } from "@/lib/twilio";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    await connectMongoDB();

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ Allow only owner role
    if (user.role !== "owner") {
      return NextResponse.json(
        { message: "Only owner can reset password" },
        { status: 403 }
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Check if OTP record already exists for this phone
    const existingOTP = await OTP.findOne({ phone });

    if (existingOTP) {
      // Update existing OTP
      existingOTP.otp = otpCode;
      existingOTP.expiresAt = expiresAt;
      await existingOTP.save();
    } else {
      // Create new OTP
      await OTP.create({ phone, otp: otpCode, expiresAt });
    }

    // Send OTP via WhatsApp
    await sendWhatsAppOTP(phone, otpCode);

    return NextResponse.json({ message: "OTP sent to WhatsApp" }, { status: 200 });
  } catch (error) {
    console.error("Forgot Password error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}